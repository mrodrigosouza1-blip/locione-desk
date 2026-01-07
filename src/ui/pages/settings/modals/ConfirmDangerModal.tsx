import Modal from "../../../components/Modal";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nProvider";
import { AK } from "../../../../i18n/keys/appKeys";

interface ConfirmDangerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function ConfirmDangerModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  loading = false,
}: ConfirmDangerModalProps) {
  const { t } = useI18n();
  const defaultCancelText = cancelText || t(AK.common.cancel);
  const defaultConfirmText = confirmText || t(AK.common.confirm);
  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <AlertTriangle size={24} style={{ color: "var(--error)", flexShrink: 0, marginTop: "0.25rem" }} />
          <p style={{ color: "var(--text-primary)", lineHeight: "1.5" }}>{message}</p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {defaultCancelText}
          </button>
          <button
            className="btn"
            onClick={handleConfirm}
            disabled={loading}
            style={{ backgroundColor: "var(--error)", color: "white" }}
          >
            {loading ? t(AK.common.processing) : defaultConfirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

