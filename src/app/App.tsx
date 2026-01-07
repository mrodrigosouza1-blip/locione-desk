import { useEffect, useState, useRef } from "react";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { initDatabase } from "../infra/database";
import { settingsRepository } from "../infra/repositories/settingsRepository";
import Layout from "../ui/Layout";
import AppGate from "../ui/components/AppGate";
import { I18nProvider } from "../i18n/I18nProvider";
import { ToastProvider } from "../ui/components/ToastProvider";
import ErrorBoundary from "../ui/components/ErrorBoundary";
import { logger } from "../utils/logger";
import { incrementBootFailCount, resetBootFailCount, isSafeModeActive } from "../utils/bootSafety";
import { verifyLicenseOnStartup, updateCrlOnStartup } from "../services/licenseBootstrap";
import Dashboard from "../ui/pages/Dashboard";
import AccountsPage from "../ui/pages/AccountsPage";
import AccountDetailPage from "../ui/pages/AccountDetailPage";
import CreditCardsPage from "../ui/pages/CreditCardsPage";
import CreditCardDetailPage from "../ui/pages/CreditCardDetailPage";
import TransactionsPage from "../ui/pages/TransactionsPage";
import CategoriesPage from "../ui/pages/CategoriesPage";
import GoalsPage from "../ui/pages/GoalsPage";
import GoalNewWizardPage from "../ui/pages/GoalNewWizardPage";
import BudgetsPage from "../ui/pages/BudgetsPage";
import ReportsPage from "../ui/pages/ReportsPage";
import SettingsPage from "../ui/pages/SettingsPage";
import AboutPage from "../ui/pages/AboutPage";
import LicensePage from "../ui/pages/LicensePage";
import PlanAndLicensePage from "../ui/pages/PlanAndLicensePage";
import AssetsDebugPage from "../ui/pages/AssetsDebugPage";

function App() {
  const [initialized, setInitialized] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const didIncrementRef = useRef(false);

  useEffect(() => {
    async function init() {
      // Proteção contra double-increment no React StrictMode
      if (didIncrementRef.current) {
        return;
      }
      didIncrementRef.current = true;
      
      try {
        // Agora inicializar o DB
        await initDatabase();
        const settings = settingsRepository.get();
        setTheme(settings.theme);
        applyTheme(settings.theme);
        
        // Verificar licença armazenada na inicialização
        await verifyLicenseOnStartup();
        
        // Atualizar CRL no startup (fire-and-forget, não bloqueia)
        updateCrlOnStartup().catch(() => {
          // Erro silencioso - não bloquear app
        });
        
        // Se chegou aqui, boot foi bem-sucedido - resetar contador
        resetBootFailCount();
        
        setInitialized(true);
      } catch (error) {
        logger.errorTag("App", "Erro ao inicializar banco de dados:", error);
        // Incrementar contador apenas quando há erro real
        incrementBootFailCount();
        // Mesmo com erro, inicializar para não travar a aplicação
        setInitialized(true);
      }
    }
    init();
  }, []);

  function applyTheme(newTheme: "light" | "dark") {
    document.documentElement.setAttribute("data-theme", newTheme);
  }

  function handleThemeChange(newTheme: "light" | "dark") {
    setTheme(newTheme);
    applyTheme(newTheme);
    settingsRepository.update("theme", newTheme);
  }

  if (!initialized) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Carregando...</div>
      </div>
    );
  }

  const safeMode = isSafeModeActive();

  // Detectar se deve usar HashRouter (file:// protocol ou produção empacotada)
  // Em produção empacotada, o Electron carrega via file://, então HashRouter é necessário
  const isFileProtocol = typeof window !== "undefined" && window.location.protocol === "file:";
  // Em desenvolvimento, usar BrowserRouter; em produção (file://), usar HashRouter
  const useHash = isFileProtocol;

  // Componente de rotas (reutilizável para ambos os routers)
  const RoutesContent = () => (
    <Routes>
      <Route path="/" element={<Layout theme={theme} onThemeChange={handleThemeChange} safeMode={safeMode} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="accounts/:id" element={<AccountDetailPage />} />
        <Route path="credit-cards" element={<CreditCardsPage />} />
        <Route path="credit-cards/:id" element={<CreditCardDetailPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/new" element={<GoalNewWizardPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="license" element={<LicensePage />} />
        <Route path="plan" element={<PlanAndLicensePage />} />
        <Route path="debug-assets" element={<AssetsDebugPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );

  return (
    <ErrorBoundary>
      <I18nProvider>
        <ToastProvider>
          <AppGate safeMode={safeMode}>
            {useHash ? (
              <HashRouter>
                <RoutesContent />
              </HashRouter>
            ) : (
              <BrowserRouter>
                <RoutesContent />
              </BrowserRouter>
            )}
          </AppGate>
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;

