import { useState } from "react";
import Modal from "../../../components/Modal";
import { hashPin } from "../../../../utils/pinUtils";
import { useI18n } from "../../../../i18n/I18nProvider";
import { PK } from "../../../../i18n/keys/pinKeys";
import { logger } from "../../../../utils/logger";

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pinHash: string) => void | Promise<void>;
  isChanging?: boolean; // Se está alterando um PIN existente
}

export default function PinSetupModal({
  isOpen,
  onClose,
  onConfirm,
  isChanging = false,
}: PinSetupModalProps) {
  const { t } = useI18n();
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setError("");
    
    // PIN básico (FREE): mínimo 4 dígitos numéricos
    // PIN premium: pode ser alfanumérico e mais longo
    if (pin1.length < 4) {
      setError(t(PK.setup.errors.minLength));
      return;
    }
    
    if (pin1 !== pin2) {
      setError(t(PK.setup.errors.mismatch));
      return;
    }
    
    setLoading(true);
    try {
      const pinHash = await hashPin(pin1);
      await onConfirm(pinHash);
      handleClose();
    } catch (err) {
      setError(t(PK.setup.errors.hashError));
      logger.errorTag("PinSetupModal", err);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setPin1("");
    setPin2("");
    setError("");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isChanging ? t(PK.setup.titleChange) : t(PK.setup.title)}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          {isChanging
            ? t(PK.setup.descriptionChange)
            : t(PK.setup.description)}
        </p>

        <div className="form-group">
          <label className="label">{t(PK.setup.label)}</label>
          <input
            type="password"
            className="input"
            value={pin1}
            onChange={(e) => {
              setPin1(e.target.value);
              setError("");
            }}
            placeholder={t(PK.setup.placeholder)}
            maxLength={20}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="label">{t(PK.setup.confirmLabel)}</label>
          <input
            type="password"
            className="input"
            value={pin2}
            onChange={(e) => {
              setPin2(e.target.value);
              setError("");
            }}
            placeholder={t(PK.setup.confirmPlaceholder)}
            maxLength={20}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pin1 && pin2) {
                handleConfirm();
              }
            }}
          />
        </div>

        {error && (
          <div style={{ color: "var(--error)", fontSize: "0.875rem" }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
            {t(PK.setup.actions.cancel)}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={loading || !pin1 || !pin2}
          >
            {loading ? t(PK.setup.actions.saving) : t(PK.setup.actions.confirm)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

