import Modal from "./Modal";
import type { BackupFile } from "../../domain/backup";
import { formatDateString } from "../../utils/format";
import { useI18n } from "../../i18n/I18nProvider";
import { BK } from "../../i18n/keys/backupKeys";

interface BackupPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  backup: BackupFile;
  onConfirm: () => void;
}

export default function BackupPreviewModal({
  isOpen,
  onClose,
  backup,
  onConfirm,
}: BackupPreviewModalProps) {
  const { t } = useI18n();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(BK.preview.title)}>
      <div className="modal-content">
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            {t(BK.preview.description)}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <strong>{t(BK.preview.labels.createdAt)}:</strong> {formatDateString(backup.createdAt)}
            </div>
            <div>
              <strong>{t(BK.preview.labels.accounts)}:</strong> {backup.meta.counts.accounts}
            </div>
            <div>
              <strong>{t(BK.preview.labels.transactions)}:</strong> {backup.meta.counts.transactions}
            </div>
            {backup.meta.counts.categories !== undefined && (
              <div>
                <strong>{t(BK.preview.labels.categories)}:</strong> {backup.meta.counts.categories}
              </div>
            )}
            <div>
              <strong>{t(BK.preview.labels.currencies)}:</strong> {backup.meta.currencies.join(", ") || t(BK.preview.labels.none)}
            </div>
            {backup.meta.dateRange && (
              <div>
                <strong>{t(BK.preview.labels.period)}:</strong> {formatDateString(backup.meta.dateRange.min)} a{" "}
                {formatDateString(backup.meta.dateRange.max)}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button className="button button-secondary" onClick={onClose}>
            {t(BK.preview.actions.cancel)}
          </button>
          <button className="button button-primary" onClick={onConfirm}>
            {t(BK.preview.actions.download)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

