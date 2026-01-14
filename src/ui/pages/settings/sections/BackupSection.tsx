import { useState } from "react";
import type { Settings } from "../../../../domain/settings";
import Toggle from "../../../components/Toggle";
import BackupPreviewModal from "../../../components/BackupPreviewModal";
import RestorePreviewModal from "../../../components/RestorePreviewModal";
import { createBackup, getBackupFilename } from "../../../../utils/backupUtils";
import { restoreBackup } from "../../../../utils/restoreUtils";
import { downloadFile, selectFile } from "../../../../utils/fileUtils";
import { validateBackupFile } from "../../../../domain/backup";
import type { BackupFile } from "../../../../domain/backup";
import { formatDateString } from "../../../../utils/format";
import { Download, Upload, RotateCw, Folder } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nProvider";
import { SK } from "../settingsKeys";
import { logger } from "../../../../utils/logger";
import { useToast } from "../../../hooks/useToast";
import { getUsageCounters } from "../../../../services/usageCounters";
import { requireGate } from "../../../../services/requireGate";
import { useNavigate } from "react-router-dom";

interface BackupSectionProps {
  settings: Settings;
  onUpdate: (partial: Partial<Settings>) => Promise<void>;
  saving?: boolean;
  onToast?: (message: string, type: "success" | "error") => void;
}

export default function BackupSection({
  settings,
  onUpdate,
  saving = false,
  onToast,
}: BackupSectionProps) {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const [backupPreview, setBackupPreview] = useState<BackupFile | null>(null);
  const [restorePreview, setRestorePreview] = useState<BackupFile | null>(null);
  const [loading, setLoading] = useState(false);

  function showToast(message: string, type: "success" | "error" = "success") {
    if (onToast) {
      onToast(message, type);
    }
  }

  async function handleToggle(key: keyof Settings["backup"], value: boolean | string) {
    await onUpdate({
      backup: {
        ...settings.backup,
        [key]: value,
      },
    });
  }

  async function handleBackup() {
    const counters = getUsageCounters();
    if (!requireGate("premium.backup", counters, toast, navigate, t)) {
      return;
    }
    try {
      setLoading(true);
      const backup = await createBackup();
      setBackupPreview(backup);
    } catch (error) {
      logger.errorTag("BackupSection", "Erro ao criar backup:", error);
      showToast(t(SK.messages.backupError), "error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmBackup() {
    if (!backupPreview) return;

    try {
      setLoading(true);
      const filename = getBackupFilename();
      await downloadFile(JSON.stringify(backupPreview, null, 2), filename);
      
      // Atualizar lastBackupAt
      await onUpdate({
        backup: {
          ...settings.backup,
          lastBackupAt: new Date().toISOString(),
        },
      });
      
      setBackupPreview(null);
      showToast(t(SK.messages.backupDownloaded));
    } catch (error) {
      logger.errorTag("BackupSection", "Erro ao baixar backup:", error);
      showToast(t(SK.messages.backupDownloadError), "error");
      toast.error(t(SK.messages.backupDownloadError));
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    const counters = getUsageCounters();
    if (!requireGate("premium.backup", counters, toast, navigate, t)) {
      return;
    }
    try {
      setLoading(true);
      const content = await selectFile(".json");
      if (!content) {
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(content);
      if (!validateBackupFile(parsed)) {
        showToast(t(SK.messages.backupInvalid), "error");
        setLoading(false);
        return;
      }

      setRestorePreview(parsed);
    } catch (error) {
      logger.errorTag("BackupSection", "Erro ao ler arquivo:", error);
      showToast(t(SK.messages.backupRestoreError), "error");
      toast.error(t(SK.messages.backupRestoreError));
    } finally {
      setLoading(false);
    }
  }

  async function confirmRestore() {
    if (!restorePreview) return;

    try {
      setLoading(true);
      await restoreBackup(restorePreview);
      setRestorePreview(null);
      showToast(t(SK.messages.backupRestored) + " Recarregue a página para aplicar as mudanças.", "success");

      // NÃO recarregar automaticamente - usuário deve clicar no botão
      // setTimeout(() => {
      //   window.location.reload();
      // }, 1000);
    } catch (error) {
      logger.errorTag("BackupSection", "Erro ao restaurar backup:", error);
      showToast(t(SK.messages.backupRestoreError), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="card" style={{ maxWidth: "600px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <RotateCw size={24} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(SK.sections.backup)}</h2>
        </div>

        {/* Bloco informativo */}
        <div
          style={{
            marginBottom: "2rem",
            padding: "1.25rem",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "1rem",
            }}
          >
            {t(SK.backup.infoTitle)}
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>
              {t(SK.backup.infoLine1)}
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>
              {t(SK.backup.infoLine2)}
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>
              {t(SK.backup.infoLine3)}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
              }}
            >
              {t(SK.backup.includesTitle)}
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <li style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                • {t(SK.backup.includesAccounts)}
              </li>
              <li style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                • {t(SK.backup.includesTransactions)}
              </li>
              <li style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                • {t(SK.backup.includesCategories)}
              </li>
              <li style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                • {t(SK.backup.includesSettings)}
              </li>
            </ul>
          </div>
        </div>

        {settings.backup.lastBackupAt && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
              {t(SK.fields.lastBackup)}:
            </p>
            <p style={{ fontSize: "1rem", fontWeight: 500 }}>
              {formatDateString(settings.backup.lastBackupAt, "dd/MM/yyyy 'às' HH:mm")}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={handleBackup}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Download size={16} />
            {t(SK.fields.backupNow)}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleRestore}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Upload size={16} />
            {t(SK.fields.restoreBackup)}
          </button>
        </div>

        {/* Aviso de restauração */}
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            backgroundColor: "var(--error-light)",
            borderRadius: "8px",
            border: "1px solid var(--error)",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--error)",
              margin: 0,
              fontWeight: 500,
            }}
          >
            {t(SK.fields.restoreWarning)}
          </p>
        </div>

        <Toggle
          label={t(SK.fields.autoBackup)}
          description={t(SK.notes.notifications)}
          checked={settings.backup.autoBackupEnabled}
          onChange={(checked) => handleToggle("autoBackupEnabled", checked)}
          disabled={saving}
        />

        {settings.backup.autoBackupEnabled && (
          <div className="form-group">
            <label className="label">{t(SK.fields.autoBackupFrequency)}</label>
            <select
              className="input"
              value={settings.backup.autoBackupFrequency}
              onChange={(e) =>
                handleToggle("autoBackupFrequency", e.target.value as "daily" | "weekly")
              }
              disabled={saving}
            >
              <option value="daily">{t(SK.fields.autoBackupFrequencyDaily)}</option>
              <option value="weekly">{t(SK.fields.autoBackupFrequencyWeekly)}</option>
            </select>
          </div>
        )}

        {typeof window !== "undefined" && (window as any).electronAPI && (
          <div className="form-group">
            <label className="label">{t(SK.fields.backupFolder)}</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="text"
                className="input"
                value={settings.backup.defaultBackupDir || t(SK.fields.notConfigured)}
                readOnly
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  // TODO: Implementar seleção de pasta via Electron API
                  showToast(t(SK.fields.folderSelectionSoon), "error");
                }}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Folder size={16} />
                {t("common.add")}
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              {t(SK.notes.notifications)}
            </p>
          </div>
        )}
      </div>

      {backupPreview && (
        <BackupPreviewModal
          isOpen={!!backupPreview}
          onClose={() => setBackupPreview(null)}
          backup={backupPreview}
          onConfirm={confirmBackup}
        />
      )}

      {restorePreview && (
        <RestorePreviewModal
          isOpen={!!restorePreview}
          onClose={() => setRestorePreview(null)}
          backup={restorePreview}
          onConfirm={confirmRestore}
        />
      )}
    </>
  );
}
