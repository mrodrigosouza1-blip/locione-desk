import { useEffect } from "react";
import { X } from "lucide-react";

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoDashboard: () => void;
  onGoAccounts: () => void;
  onGoCards: () => void;
  onGoReports: () => void;
}

/**
 * Modal de ações rápidas (atalho Ctrl/Cmd + K)
 */
export default function QuickActionsModal({
  isOpen,
  onClose,
  onGoDashboard,
  onGoCards,
  onGoAccounts,
  onGoReports,
}: QuickActionsModalProps) {
  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Bloquear scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--bg-primary)",
          borderRadius: "8px",
          padding: "1.5rem",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Ações Rápidas
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <button
            className="btn btn-primary"
            onClick={() => {
              onGoDashboard();
              onClose();
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              padding: "0.75rem 1rem",
            }}
          >
            Ir para Dashboard
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onGoAccounts();
              onClose();
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              padding: "0.75rem 1rem",
            }}
          >
            Ir para Contas
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onGoCards();
              onClose();
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              padding: "0.75rem 1rem",
            }}
          >
            Ir para Cartões
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onGoReports();
              onClose();
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              padding: "0.75rem 1rem",
            }}
          >
            Ir para Relatórios
          </button>
        </div>
      </div>
    </div>
  );
}

