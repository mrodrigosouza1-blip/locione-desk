import { Component, ReactNode } from "react";
import { getI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import { logger } from "../../utils/logger";
import { Copy, RotateCw } from "lucide-react";
import { useToast } from "../hooks/useToast";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Helper para copiar texto para clipboard
function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback para navegadores antigos
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand("copy");
    return Promise.resolve();
  } finally {
    document.body.removeChild(textArea);
  }
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.errorTag("ErrorBoundary", "ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { t } = getI18n();
      const isDev = process.env.NODE_ENV !== "production" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      return (
        <ErrorBoundaryUI
          error={this.state.error}
          isDev={isDev}
          t={t}
        />
      );
    }

    return this.props.children;
  }
}

// Componente funcional para UI do erro (permite usar hooks)
function ErrorBoundaryUI({
  error,
  isDev,
  t,
}: {
  error: Error | null;
  isDev: boolean;
  t: (key: string) => string;
}) {
  const toast = useToast();

  const handleCopy = async () => {
    if (!error) return;
    
    const errorText = `${error.message}${error.stack ? `\n\n${error.stack}` : ""}`;
    
    try {
      await copyToClipboard(errorText);
      toast.success("Detalhes copiados para a área de transferência");
    } catch (err) {
      logger.errorTag("ErrorBoundary", "Erro ao copiar detalhes:", err);
      toast.error("Erro ao copiar detalhes");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "2rem",
        textAlign: "center",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
        Ocorreu um erro
      </h1>
      <p style={{ marginBottom: "2rem", color: "var(--text-secondary)" }}>
        {t(AK.errorBoundary.message) || "Algo deu errado. Por favor, tente recarregar a página."}
      </p>
      {error && (
        <details
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            background: "var(--bg-secondary)",
            borderRadius: "8px",
            maxWidth: "600px",
            textAlign: "left",
            fontSize: "0.875rem",
            width: "100%",
          }}
        >
          <summary style={{ cursor: "pointer", marginBottom: "0.5rem", fontWeight: 600 }}>
            {t(AK.errorBoundary.details) || "Detalhes do erro"}
          </summary>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          className="btn btn-secondary"
          onClick={handleCopy}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Copy size={16} />
          Copiar detalhes
        </button>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <RotateCw size={16} />
          {t(AK.errorBoundary.reload) || "Recarregar"}
        </button>
      </div>
    </div>
  );
}
