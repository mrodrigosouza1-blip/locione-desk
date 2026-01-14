import { useState } from "react";
import type { Settings } from "../../../../domain/settings";
import { settingsRepository } from "../../../../infra/repositories/settingsRepository";
import { repairDatabase } from "../../../../utils/databaseRepair";
import LogsModal from "../modals/LogsModal";
import ConfirmDangerModal from "../modals/ConfirmDangerModal";
import { Activity, Database, FileText, RotateCw } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nProvider";
import { SK } from "../settingsKeys";
import { logger } from "../../../../utils/logger";
import { useToast } from "../../../hooks/useToast";
import ResetDatabaseModal from "../../../components/ResetDatabaseModal";
import { resetDatabase } from "../../../../utils/resetDatabase";
import { IS_DEV } from "../../../../utils/isDev";

interface DiagnosticsSectionProps {
  settings: Settings;
  onUpdate?: (partial: Partial<Settings>) => Promise<void>;
  onToast?: (message: string, type: "success" | "error") => void;
}

export default function DiagnosticsSection({
  onToast,
}: DiagnosticsSectionProps) {
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isRepairConfirmOpen, setIsRepairConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetDatabaseOpen, setIsResetDatabaseOpen] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resettingDatabase, setResettingDatabase] = useState(false);
  const { t } = useI18n();
  const toast = useToast();

  function showToast(message: string, type: "success" | "error" = "success") {
    if (onToast) {
      onToast(message, type);
    } else {
      if (type === "error") {
        toast.error(message);
      } else {
        toast.success(message);
      }
    }
  }

  async function handleRepair() {
    setRepairing(true);
    try {
      const report = await repairDatabase();
      if (report.errors.length > 0) {
        showToast(t(SK.messages.repairCompletedWithErrors, { errors: report.errors.join(", ") }), "error");
      } else if (report.fixed.length > 0) {
        showToast(t(SK.messages.repairCompleted, { fixed: report.fixed.join("; ") }));
      } else {
        showToast(t(SK.messages.repairNoIssues));
      }
      setIsRepairConfirmOpen(false);
    } catch (error) {
      logger.errorTag("DiagnosticsSection", "Erro ao reparar banco:", error);
      showToast(t(SK.messages.repairError), "error");
    } finally {
      setRepairing(false);
    }
  }

  async function handleResetSettings() {
    setResetting(true);
    try {
      await settingsRepository.resetSettings();
      showToast(t(SK.messages.resetCompleted) + " Recarregue a página para aplicar as mudanças.");
      setIsResetConfirmOpen(false);
      // NÃO recarregar automaticamente - usuário deve clicar no botão
      // if (onReload) {
      //   setTimeout(() => onReload(), 500);
      // }
    } catch (error) {
      logger.errorTag("DiagnosticsSection", "Erro ao resetar configurações:", error);
      showToast(t(SK.messages.resetError), "error");
    } finally {
      setResetting(false);
    }
  }

  async function handleResetDatabase() {
    setResettingDatabase(true);
    try {
      await resetDatabase();
      toast.success((t("about.license.resetDatabase.success") || "Banco resetado com sucesso") + " Recarregue a página para aplicar as mudanças.");
      setIsResetDatabaseOpen(false);
      // NÃO recarregar automaticamente - usuário deve clicar no botão
      // setTimeout(() => {
      //   window.location.reload();
      // }, 1000);
    } catch (error) {
      logger.errorTag("DiagnosticsSection", "Erro ao resetar banco de dados:", error);
      toast.error(t("about.license.resetDatabase.error") || "Erro ao resetar banco de dados");
    } finally {
      setResettingDatabase(false);
    }
  }

  // Obter versão do app (placeholder se não disponível)
  const appVersion = (typeof window !== "undefined" && (window as any).electronAPI?.getVersion)
    ? "1.0.0" // Será preenchido via Electron API se disponível
    : "1.0.0";

  // Obter caminho do banco
  // Em PROD: mostrar texto neutro; em DEV: mostrar path completo
  const dbPath = (() => {
    if (!IS_DEV) {
      // Em produção: texto neutro sem path técnico
      return "Dados locais deste computador";
    }
    // Em DEV: tentar obter path real
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      return "Salvo localmente (caminho via Electron API)";
    }
    return "localStorage";
  })();

  return (
    <>
      <div id="diagnostics-section" className="card" style={{ maxWidth: "600px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <Activity size={24} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(SK.sections.diagnostics)}</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Database size={16} />
              <strong style={{ fontSize: "0.875rem" }}>{t(SK.fields.version)}</strong>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{appVersion}</p>
          </div>

          <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <FileText size={16} />
              <strong style={{ fontSize: "0.875rem" }}>{t(SK.fields.dbPath)}</strong>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
              {dbPath}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "2rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsLogsOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-start" }}
          >
            <FileText size={16} />
            {t(SK.fields.viewLogs)}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsRepairConfirmOpen(true)}
            disabled={repairing}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-start" }}
          >
            <RotateCw size={16} />
            {repairing ? t("common.loading") : t(SK.fields.repairDb)}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={resetting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "flex-start",
              color: "var(--error)",
            }}
          >
            <RotateCw size={16} />
            {resetting ? t("common.loading") : t(SK.fields.resetSettings)}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsResetDatabaseOpen(true)}
            disabled={resettingDatabase}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "flex-start",
              color: "var(--error)",
            }}
          >
            <Database size={16} />
            {resettingDatabase ? t("common.loading") : (t("about.license.resetDatabase.button") || "Resetar Banco de Dados")}
          </button>
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "1rem" }}>
          {t(SK.notes.repairDb)}
          <br />
          {t(SK.notes.resetSettings)}
        </p>
      </div>

      <LogsModal isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />

      <ConfirmDangerModal
        isOpen={isRepairConfirmOpen}
        onClose={() => setIsRepairConfirmOpen(false)}
        onConfirm={handleRepair}
        title={t(SK.fields.repairDb)}
        message={t(SK.notes.repairDb)}
        confirmText={t(SK.fields.repairDb)}
        loading={repairing}
      />

      <ConfirmDangerModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetSettings}
        title={t(SK.fields.resetSettings)}
        message={t(SK.notes.resetSettings)}
        confirmText={t(SK.fields.resetSettings)}
        loading={resetting}
      />

      <ResetDatabaseModal
        isOpen={isResetDatabaseOpen}
        onClose={() => setIsResetDatabaseOpen(false)}
        onConfirm={handleResetDatabase}
      />
    </>
  );
}
