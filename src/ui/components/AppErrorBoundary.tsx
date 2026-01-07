import { Component, ReactNode } from "react";
import { logger } from "../../utils/logger";
import { getI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

/**
 * ErrorBoundary específico para o conteúdo da página (Outlet).
 * Mantém o sidebar visível e mostra erro apenas na área de conteúdo.
 */
export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.errorTag("AppErrorBoundary", "AppErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Verificar se está em modo dev (sem usar import.meta.env que pode não estar disponível)
      const isDev = process.env.NODE_ENV !== "production" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "2rem",
            textAlign: "center",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
          }}
        >
          {(() => {
            const { t } = getI18n();
            return (
              <>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
                  {t(AK.errorBoundary.title)}
                </h1>
                <p style={{ marginBottom: "2rem", color: "var(--text-secondary)" }}>
                  {t(AK.errorBoundary.message)}
                </p>
                
                {isDev && this.state.error && (
                  <details
                    style={{
                      marginBottom: "2rem",
                      padding: "1rem",
                      background: "var(--bg-secondary)",
                      borderRadius: "8px",
                      maxWidth: "800px",
                      width: "100%",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      maxHeight: "400px",
                      overflow: "auto",
                    }}
                  >
                    <summary style={{ cursor: "pointer", marginBottom: "0.5rem", fontWeight: 600 }}>
                      {t(AK.errorBoundary.details)}
                    </summary>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: 0,
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {this.state.error.message}
                      {this.state.error.stack && `\n\n${this.state.error.stack}`}
                      {this.state.errorInfo?.componentStack && `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                    </pre>
                  </details>
                )}
                
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-secondary" onClick={() => window.history.back()}>
                    {t(AK.common.back)}
                  </button>
                  <button className="btn btn-primary" onClick={this.handleReload}>
                    {t(AK.errorBoundary.reload)}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      );
    }

    return this.props.children;
  }
}

