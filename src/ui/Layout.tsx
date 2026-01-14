import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  FolderTree,
  Target,
  PieChart,
  BarChart3,
  Settings,
  Info,
  Lock,
  Key,
} from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { AK } from "../i18n/keys/appKeys";
import { APP_NAME } from "../config/brand";
import AppErrorBoundary from "./components/AppErrorBoundary";
import SafeModeBanner from "./components/SafeModeBanner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import LogsModal from "./pages/settings/modals/LogsModal";
import ConfirmDangerModal from "./pages/settings/modals/ConfirmDangerModal";
import RestorePreviewModal from "./components/RestorePreviewModal";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import QuickActionsModal from "./components/QuickActionsModal";
import { settingsRepository } from "../infra/repositories/settingsRepository";
import { restoreBackup } from "../utils/restoreUtils";
import { selectFile } from "../utils/fileUtils";
import { validateBackupFile } from "../domain/backup";
import { useToast } from "./hooks/useToast";
import { SK } from "./pages/settings/settingsKeys";
import { deactivateSafeMode } from "../utils/bootSafety";
import { getUsageCounters } from "../services/usageCounters";
import { checkGate } from "../services/planGate";
import PremiumTag from "./components/PremiumTag";
import BrandLogo from "../shared/components/BrandLogo";

const routes = [
  { path: "/dashboard", label: AK.nav.dashboard, icon: LayoutDashboard },
  { path: "/accounts", label: AK.nav.accounts, icon: Wallet },
  { path: "/credit-cards", label: AK.nav.creditCards, icon: CreditCard },
  { path: "/transactions", label: AK.nav.transactions, icon: ArrowLeftRight },
  { path: "/categories", label: AK.nav.categories, icon: FolderTree },
  { path: "/goals", label: AK.nav.goals, icon: Target },
  { path: "/budgets", label: AK.nav.budgets, icon: PieChart, showPremiumTag: "budgets.access" as const },
  { path: "/reports", label: AK.nav.reports, icon: BarChart3, showPremiumTag: "reports.access" as const },
  { path: "/plan", label: AK.nav.plan, icon: Key },
  { path: "/settings", label: AK.nav.settings, icon: Settings },
  { path: "/about", label: AK.nav.about, icon: Info },
];

interface LayoutProps {
  theme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
  safeMode?: boolean;
}

export default function Layout({ safeMode = false }: LayoutProps) {
  const location = useLocation();
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isRestorePreviewOpen, setRestorePreviewOpen] = useState(false);
  const [restorePreview, setRestorePreview] = useState<any>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  // Atalhos de teclado globais
  useGlobalShortcuts({
    goSettings: () => navigate("/settings"),
    goLicense: () => navigate("/license"),
    openQuickActions: () => setIsQuickActionsOpen(true),
  });

  function handleDiagnosticsClick() {
    navigate("/settings");
    // Scroll para DiagnosticsSection será feito pela página
    setTimeout(() => {
      const diagnosticsSection = document.getElementById("diagnostics-section");
      if (diagnosticsSection) {
        diagnosticsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }

  async function handleResetSettings() {
    try {
      await settingsRepository.resetSettings();
      deactivateSafeMode();
      toast.success(t(SK.messages.resetCompleted) + " Recarregue a página para aplicar as mudanças.");
      // NÃO recarregar automaticamente - usuário deve clicar no botão
      // window.location.reload();
    } catch (error) {
      toast.error(t(SK.messages.resetError));
    }
  }

  async function handleRestoreBackup() {
    try {
      const content = await selectFile(".json");
      if (!content) return;

      const parsed = JSON.parse(content);
      if (!validateBackupFile(parsed)) {
        toast.error(t(SK.messages.backupInvalid));
        return;
      }

      setRestorePreview(parsed);
      setRestorePreviewOpen(true);
    } catch (error) {
      toast.error(t(SK.messages.backupRestoreError));
    }
  }

  async function handleConfirmRestore() {
    if (!restorePreview) return;

    try {
      await restoreBackup(restorePreview);
      deactivateSafeMode();
      setRestorePreviewOpen(false);
      setRestorePreview(null);
      toast.success(t(SK.messages.backupRestored) + " Recarregue a página para aplicar as mudanças.");
      // NÃO recarregar automaticamente - usuário deve clicar no botão
      // setTimeout(() => {
      //   window.location.reload();
      // }, 1000);
    } catch (error) {
      toast.error(t(SK.messages.backupRestoreError));
    }
  }

  return (
    <div className="app-shell" style={{ display: "flex", height: "100vh", minHeight: "100vh", overflow: "hidden", flexDirection: "column" }}>
      {safeMode && (
        <SafeModeBanner
          onDiagnosticsClick={handleDiagnosticsClick}
          onResetSettings={() => setIsResetConfirmOpen(true)}
          onRestoreBackup={handleRestoreBackup}
        />
      )}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          width: "240px",
          flex: "0 0 240px",
          backgroundColor: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 0",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "0 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <BrandLogo variant="icon" size="md" />
          <h1
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              opacity: 0.8,
            }}
          >
            {APP_NAME}
          </h1>
        </div>

        <nav style={{ flex: 1 }}>
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = location.pathname === route.path;
            
            // Verificar se deve mostrar PremiumTag (apenas indicador visual, não bloqueia)
            let showPremiumTag = false;
            let premiumTagTooltip = "";
            if (route.showPremiumTag) {
              const counters = getUsageCounters();
              const gateResult = checkGate(route.showPremiumTag, counters);
              showPremiumTag = !gateResult.ok;
              if (showPremiumTag && gateResult.title && gateResult.reason) {
                const title = t(gateResult.title);
                const reason = t(gateResult.reason);
                premiumTagTooltip = `${title}\n${reason}`;
              }
            }
            
            // Verificar se está bloqueado (gated) - para outros itens que ainda usam bloqueio
            // Nota: budgets e reports não usam mais gated, apenas showPremiumTag
            let locked = false;
            let gateMessage = "";
            const routeWithGated = route as typeof route & { gated?: string };
            if (routeWithGated.gated) {
              const counters = getUsageCounters();
              const gateResult = checkGate(routeWithGated.gated as any, counters);
              locked = !gateResult.ok;
              if (locked && gateResult.title && gateResult.reason) {
                const title = t(gateResult.title);
                const reason = t(gateResult.reason);
                gateMessage = `${title}\n${reason}`;
              }
            }
            
            const handleLockedClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (gateMessage) {
                toast.error(gateMessage);
              } else {
                toast.error(t("gate.generic.message"));
              }
              setTimeout(() => {
                navigate("/license");
              }, 500);
            };

            if (locked) {
              return (
                <div
                  key={route.path}
                  onClick={handleLockedClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.75rem 1.5rem",
                    color: "var(--text-tertiary)",
                    backgroundColor: "transparent",
                    fontSize: "0.9375rem",
                    fontWeight: 400,
                    opacity: 0.5,
                    cursor: "not-allowed",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.5";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                    <Icon size={20} />
                    <span>{t(route.label)}</span>
                  </div>
                  <Lock size={16} style={{ opacity: 0.7 }} />
                </div>
              );
            }

            return (
              <Link
                key={route.path}
                to={route.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: "0.75rem 1.5rem",
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  backgroundColor: isActive ? "var(--primary-alpha)" : "transparent",
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                  <Icon size={20} />
                  <span>{t(route.label)}</span>
                </div>
                {showPremiumTag && (
                  <PremiumTag 
                    title={premiumTagTooltip || (route.showPremiumTag === "budgets.access" ? t("gate.budgets.message") : t("gate.reports.viewOnly"))} 
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="content" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <main className="main" style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "24px" }}>
          <AppErrorBoundary>
            <Outlet />
          </AppErrorBoundary>
        </main>
      </div>
      </div>

      <LogsModal isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
      
      <ConfirmDangerModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetSettings}
        title={t(SK.messages.resetConfirmTitle) || "Resetar Configurações"}
        message={t(SK.messages.resetConfirmMessage) || "Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita."}
        confirmText={t(SK.messages.reset)}
      />

      {restorePreview && (
        <RestorePreviewModal
          isOpen={isRestorePreviewOpen}
          onClose={() => {
            setRestorePreviewOpen(false);
            setRestorePreview(null);
          }}
          backup={restorePreview}
          onConfirm={handleConfirmRestore}
        />
      )}

      <QuickActionsModal
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onGoDashboard={() => navigate("/dashboard")}
        onGoAccounts={() => navigate("/accounts")}
        onGoCards={() => navigate("/credit-cards")}
        onGoReports={() => navigate("/reports")}
      />
    </div>
  );
}
