import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";
import { FileText } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nProvider";
import { LK } from "../../../../i18n/keys/logsKeys";
import { logger } from "../../../../utils/logger";

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogsModal({ isOpen, onClose }: LogsModalProps) {
  const { t } = useI18n();
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    } else {
      setLogs("");
      setError("");
    }
  }, [isOpen]);

  async function loadLogs() {
    setLoading(true);
    setError("");
    
    try {
      // Tentar ler logs via Electron API se disponível
      if (typeof window !== "undefined" && (window as any).electronAPI?.readLogs) {
        const logContent = await (window as any).electronAPI.readLogs();
        setLogs(logContent || t(LK.noLogs));
      } else {
        // Fallback: mostrar instrução
        setLogs(t(LK.notAvailable));
      }
    } catch (err) {
      setError(t(LK.error));
      logger.errorTag("LogsModal", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(LK.title)}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", minHeight: "400px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <FileText size={16} />
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {t(LK.systemLogs)}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            {t(LK.loading)}
          </div>
        ) : error ? (
          <div style={{ color: "var(--error)", padding: "1rem" }}>{error}</div>
        ) : (
          <textarea
            readOnly
            value={logs}
            style={{
              width: "100%",
              flex: 1,
              minHeight: "400px",
              fontFamily: "monospace",
              fontSize: "0.75rem",
              padding: "1rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              resize: "vertical",
            }}
          />
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {t(LK.actions.close)}
          </button>
          {!loading && !error && logs && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(logs);
              }}
            >
              {t(LK.actions.copy)}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

