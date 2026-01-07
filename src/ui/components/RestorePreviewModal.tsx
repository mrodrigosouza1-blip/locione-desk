import { useState } from "react";
import Modal from "./Modal";
import type { BackupFile } from "../../domain/backup";
import { formatDateString } from "../../utils/format";
import { useI18n } from "../../i18n/I18nProvider";
import { BK } from "../../i18n/keys/backupKeys";

interface RestorePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  backup: BackupFile;
  onConfirm: () => void;
}

export default function RestorePreviewModal({
  isOpen,
  onClose,
  backup,
  onConfirm,
}: RestorePreviewModalProps) {
  const { t } = useI18n();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(BK.preview.restoreTitle)}>
      <div className="modal-content">
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            backgroundColor: "var(--error-light)",
            border: "1px solid var(--error)",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "var(--error)", margin: 0, fontWeight: 600 }}>
            {t(BK.preview.warning)}
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            {t(BK.preview.restoreDescription)}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <strong>{t(BK.preview.labels.backupDate)}:</strong> {formatDateString(backup.createdAt)}
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

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ width: "18px", height: "18px" }}
            />
            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
              {t(BK.preview.confirmText)}
            </span>
          </label>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button className="button button-secondary" onClick={onClose}>
            {t(BK.preview.actions.cancel)}
          </button>
          <button
            className="button button-primary"
            onClick={onConfirm}
            disabled={!confirmed}
            style={{ opacity: confirmed ? 1 : 0.5, cursor: confirmed ? "pointer" : "not-allowed" }}
          >
            {t(BK.preview.actions.restore)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

