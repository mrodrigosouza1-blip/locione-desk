import { useState } from "react";
import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";

interface DeleteOption {
  value: string;
  label: string;
  description?: string;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (option: string) => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  options?: DeleteOption[];
  requireCheckbox?: boolean;
  checkboxLabel?: string;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  options,
  requireCheckbox = false,
  checkboxLabel,
  loading = false,
}: ConfirmDeleteModalProps) {
  const { t } = useI18n();
  const [selectedOption, setSelectedOption] = useState<string>(options?.[0]?.value || "");
  const [confirmed, setConfirmed] = useState(false);

  function handleClose() {
    setSelectedOption(options?.[0]?.value || "");
    setConfirmed(false);
    onClose();
  }

  async function handleConfirm() {
    if (requireCheckbox && !confirmed) return;
    if (options && !selectedOption) return;
    
    try {
      await onConfirm(selectedOption);
      handleClose();
    } catch (error) {
      // Erro será tratado pelo componente pai
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <AlertTriangle size={24} style={{ color: "var(--error)", flexShrink: 0, marginTop: "0.25rem" }} />
          <p style={{ color: "var(--text-primary)", lineHeight: "1.5" }}>{message}</p>
        </div>

        {options && options.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
            {options.map((option) => (
              <label
                key={option.value}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor: selectedOption === option.value ? "var(--bg-secondary)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="deleteOption"
                  value={option.value}
                  checked={selectedOption === option.value}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  style={{ marginTop: "0.25rem", cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      {option.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        {requireCheckbox && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
            <input
              type="checkbox"
              id="delete-confirm"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: "0.25rem", cursor: "pointer" }}
            />
            <label
              htmlFor="delete-confirm"
              style={{ fontSize: "0.875rem", color: "var(--text-primary)", cursor: "pointer", lineHeight: "1.5" }}
            >
              {checkboxLabel || t("common.confirmDelete")}
            </label>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
            {t(AK.common.cancel)}
          </button>
          <button
            className="btn"
            onClick={handleConfirm}
            disabled={loading || (requireCheckbox && !confirmed) || (options && !selectedOption)}
            style={{ backgroundColor: "var(--error)", color: "white" }}
          >
            {loading ? t(AK.common.processing) : (confirmLabel || t("common.delete"))}
          </button>
        </div>
      </div>
    </Modal>
  );
}

