import { useState } from "react";
import Modal from "../../../components/Modal";
import { verifyPin } from "../../../../utils/pinUtils";
import { useI18n } from "../../../../i18n/I18nProvider";
import { PK } from "../../../../i18n/keys/pinKeys";
import { logger } from "../../../../utils/logger";

interface PinVerifyModalProps {
  isOpen: boolean;
  pinHash: string;
  onVerify: () => void;
  onCancel?: () => void;
}

export default function PinVerifyModal({
  isOpen,
  pinHash,
  onVerify,
  onCancel,
}: PinVerifyModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  async function handleVerify() {
    setError("");
    setLoading(true);
    
    try {
      const isValid = await verifyPin(pin, pinHash);
      if (isValid) {
        setPin("");
        onVerify();
      } else {
        setError(t(PK.verify.errors.incorrect));
        setPin("");
      }
    } catch (err) {
      setError(t(PK.verify.errors.verifyError));
      logger.errorTag("PinVerifyModal", err);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setPin("");
    setError("");
    // Sempre chamar onCancel se fornecido (mesmo ao fechar modal)
    if (onCancel) {
      onCancel();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t(PK.verify.title)}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          {t(PK.verify.description)}
        </p>

        <div className="form-group">
          <label className="label">{t(PK.verify.label)}</label>
          <input
            type="password"
            className="input"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
            placeholder={t(PK.verify.placeholder)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && pin) {
                handleVerify();
              }
            }}
          />
        </div>

        {error && (
          <div style={{ color: "var(--error)", fontSize: "0.875rem" }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          {onCancel && (
            <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              {t(PK.verify.actions.cancel)}
            </button>
          )}
          <button className="btn btn-primary" onClick={handleVerify} disabled={loading || !pin}>
            {loading ? t(PK.verify.actions.verifying) : t(PK.verify.actions.confirm)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

