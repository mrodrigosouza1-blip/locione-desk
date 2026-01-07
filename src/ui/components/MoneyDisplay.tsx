import { formatMoneyWithSecondary } from "../../utils/format";
import type { Settings } from "../../domain/settings";

interface MoneyDisplayProps {
  amountCents: number;
  currencyCode: string;
  settings?: Settings | null;
  primaryStyle?: React.CSSProperties;
  secondaryStyle?: React.CSSProperties;
  showSecondary?: boolean; // Se false, não renderiza secondary mesmo se disponível (útil para inputs)
}

/**
 * Componente para exibir valor monetário com moeda secundária (se habilitada).
 * Renderiza valor principal e, opcionalmente, linha secundária abaixo.
 */
export default function MoneyDisplay({
  amountCents,
  currencyCode,
  settings,
  primaryStyle,
  secondaryStyle,
  showSecondary = true,
}: MoneyDisplayProps) {
  const formatted = formatMoneyWithSecondary(amountCents, currencyCode, settings || undefined);
  
  return (
    <div>
      <div style={primaryStyle}>{formatted.primary}</div>
      {showSecondary && formatted.secondary && (
        <div
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            marginTop: "0.25rem",
            ...secondaryStyle,
          }}
        >
          ≈ {formatted.secondary}
        </div>
      )}
    </div>
  );
}

