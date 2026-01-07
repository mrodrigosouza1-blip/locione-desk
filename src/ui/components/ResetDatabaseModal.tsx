import { useState } from "react";
import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import PinVerifyModal from "../pages/settings/modals/PinVerifyModal";
import { settingsRepository } from "../../infra/repositories/settingsRepository";

interface ResetDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ResetDatabaseModal({
  isOpen,
  onClose,
  onConfirm,
}: ResetDatabaseModalProps) {
  const { t } = useI18n();
  const [confirmed, setConfirmed] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const settings = settingsRepository.getSettings();
  const pinEnabled = settings.security.pinEnabled && settings.security.pinHash;

  function handleClose() {
    setConfirmed(false);
    setVerifyingPin(false);
    setPinVerified(false);
    setLoading(false);
    onClose();
  }

  async function handleConfirm() {
    if (!confirmed) return;
    
    // Se PIN está ativo, verificar primeiro
    if (pinEnabled && !pinVerified) {
      setVerifyingPin(true);
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
      handleClose();
    } catch (error) {
      // Erro será tratado pelo componente pai
    } finally {
      setLoading(false);
    }
  }

  function handlePinVerified() {
    setPinVerified(true);
    setVerifyingPin(false);
    // Após verificar PIN, executar reset
    handleConfirm();
  }

  if (verifyingPin && pinEnabled) {
    return (
      <PinVerifyModal
        isOpen={true}
        pinHash={settings.security.pinHash!}
        onVerify={handlePinVerified}
        onCancel={() => setVerifyingPin(false)}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("about.license.resetDatabase.title") || "Resetar Banco de Dados"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <AlertTriangle size={24} style={{ color: "var(--error)", flexShrink: 0, marginTop: "0.25rem" }} />
          <p style={{ color: "var(--text-primary)", lineHeight: "1.5" }}>
            {t("about.license.resetDatabase.message") || "Apaga todos os dados locais do app (contas, transações, categorias, metas, etc.). Esta ação não pode ser desfeita."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
          <input
            type="checkbox"
            id="reset-confirm"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ marginTop: "0.25rem", cursor: "pointer" }}
          />
          <label
            htmlFor="reset-confirm"
            style={{ fontSize: "0.875rem", color: "var(--text-primary)", cursor: "pointer", lineHeight: "1.5" }}
          >
            {t("about.license.resetDatabase.confirmCheckbox") || "Eu entendo que perderei todos os dados"}
          </label>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
            {t(AK.common.cancel)}
          </button>
          <button
            className="btn"
            onClick={handleConfirm}
            disabled={!confirmed || loading}
            style={{ backgroundColor: "var(--error)", color: "white" }}
          >
            {loading ? t(AK.common.processing) : (t("about.license.resetDatabase.button") || "Resetar Banco")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

