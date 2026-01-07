import { Crown } from "lucide-react";

interface PremiumTagProps {
  title?: string; // Texto do tooltip (atributo HTML title)
  className?: string;
}

/**
 * Componente discreto para sinalizar recursos Premium (apenas informativo)
 */
export default function PremiumTag({ 
  title,
  className = "",
}: PremiumTagProps) {
  return (
    <span
      className={className}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "var(--accent-primary)",
        padding: "0.125rem 0.375rem",
        borderRadius: "4px",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
      }}
    >
      <Crown size={12} />
      <span>Premium</span>
    </span>
  );
}

