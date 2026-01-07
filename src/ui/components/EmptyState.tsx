import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  message?: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: ReactNode;
}

/**
 * Componente padronizado para estados vazios
 */
export default function EmptyState({
  title,
  message,
  ctaLabel,
  onCta,
  icon,
}: EmptyStateProps) {
  return (
    <div className="card">
      <div className="empty-state">
        {icon && <div className="empty-state-icon">{icon}</div>}
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
          {title}
        </h3>
        {message && (
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            {message}
          </p>
        )}
        {ctaLabel && onCta && (
          <button className="btn btn-primary" style={{ marginTop: "0.5rem" }} onClick={onCta}>
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}

