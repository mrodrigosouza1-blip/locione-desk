import { Component, ReactNode } from "react";
import { getI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import { logger } from "../../utils/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
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

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { t } = getI18n();
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
            {t(AK.errorBoundary.title)}
          </h1>
          <p style={{ marginBottom: "2rem", color: "var(--text-secondary)" }}>
            {t(AK.errorBoundary.message)}
          </p>
          {this.state.error && (
            <details
              style={{
                marginBottom: "2rem",
                padding: "1rem",
                background: "var(--bg-secondary)",
                borderRadius: "8px",
                maxWidth: "600px",
                textAlign: "left",
                fontSize: "0.875rem",
              }}
            >
              <summary style={{ cursor: "pointer", marginBottom: "0.5rem" }}>{t(AK.errorBoundary.details)}</summary>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {this.state.error.message}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
          )}
          <button className="btn btn-primary" onClick={this.handleReload}>
            {t(AK.errorBoundary.reload)}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

