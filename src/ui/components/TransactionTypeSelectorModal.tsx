import Modal from "./Modal";
import { Wallet, CreditCard } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";

interface TransactionTypeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: "account" | "card") => void;
}

export default function TransactionTypeSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: TransactionTypeSelectorModalProps) {
  const { t } = useI18n();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(AK.common.newTransaction) || "Novo lançamento"}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          {t(AK.common.chooseTransactionType)}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSelect("account")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              justifyContent: "flex-start",
              padding: "1rem",
            }}
          >
            <Wallet size={24} />
            <span style={{ fontSize: "1rem", fontWeight: 600 }}>{t(AK.common.account)}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSelect("card")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              justifyContent: "flex-start",
              padding: "1rem",
            }}
          >
            <CreditCard size={24} />
            <span style={{ fontSize: "1rem", fontWeight: 600 }}>{t(AK.common.creditCard)}</span>
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t(AK.common.cancel)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

