import { useI18n } from "../../i18n/I18nProvider";
import { deactivateSafeMode } from "../../utils/bootSafety";
import { AlertTriangle, X, Database, RotateCw, Upload } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { logger } from "../../utils/logger";
import { AK } from "../../i18n/keys/appKeys";

interface SafeModeBannerProps {
  onDiagnosticsClick: () => void;
  onResetSettings: () => void;
  onRestoreBackup: () => void;
}

export default function SafeModeBanner({
  onDiagnosticsClick,
  onResetSettings,
  onRestoreBackup,
}: SafeModeBannerProps) {
  const { t } = useI18n();
  const toast = useToast();

  function handleDeactivate() {
    try {
      deactivateSafeMode();
      toast.success(t(AK.common.safeModeDeactivated));
      window.location.reload();
    } catch (error) {
      logger.errorTag("SafeModeBanner", "Erro ao desativar safe mode:", error);
      toast.error(t(AK.common.error));
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--warning, #f59e0b)",
        color: "white",
        padding: "1rem",
        zIndex: 100000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
        <AlertTriangle size={20} />
        <span style={{ fontWeight: 600 }}>
          {t(AK.common.safeModeActive)}
        </span>
        <span style={{ fontSize: "0.875rem", opacity: 0.9 }}>
          {t(AK.common.safeModeDescription)}
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          className="btn"
          onClick={onDiagnosticsClick}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            fontSize: "0.875rem",
            padding: "0.5rem 1rem",
          }}
        >
          <Database size={16} style={{ marginRight: "0.5rem" }} />
          {t(AK.common.openDiagnostics)}
        </button>

        <button
          className="btn"
          onClick={onResetSettings}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            fontSize: "0.875rem",
            padding: "0.5rem 1rem",
          }}
        >
          <RotateCw size={16} style={{ marginRight: "0.5rem" }} />
          {t(AK.common.resetSettings)}
        </button>

        <button
          className="btn"
          onClick={onRestoreBackup}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            fontSize: "0.875rem",
            padding: "0.5rem 1rem",
          }}
        >
          <Upload size={16} style={{ marginRight: "0.5rem" }} />
          {t(AK.common.restoreBackup)}
        </button>

        <button
          className="btn"
          onClick={handleDeactivate}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            fontSize: "0.875rem",
            padding: "0.5rem",
            minWidth: "auto",
          }}
          title={t(AK.common.deactivateSafeMode)}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

