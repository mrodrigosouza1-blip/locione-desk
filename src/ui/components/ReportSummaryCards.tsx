import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, DollarSign, Wallet } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { useI18n } from "../../i18n/I18nProvider";

interface ReportSummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  balanceVariation: number;
  balanceVariationPercent: number;
  availableBalance: number;
  currency: string;
  ui?: {
    incomeCard: { value: number; dimmed: boolean; displayDash: boolean };
    expenseCard: { value: number; dimmed: boolean; displayDash: boolean };
  };
}

export default function ReportSummaryCards({
  totalIncome,
  totalExpense,
  balance,
  balanceVariation,
  balanceVariationPercent,
  availableBalance,
  currency,
  ui,
}: ReportSummaryCardsProps) {
  const { t } = useI18n();
  const isPositive = balance >= 0;
  const hasVariation = balanceVariation !== 0;
  const isVariationPositive = balanceVariation > 0;
  const isAvailablePositive = availableBalance >= 0;

  return (
    <div className="grid grid-5" style={{ marginBottom: "2rem" }}>
      {/* Total de Entradas */}
      <div className="card" style={{ opacity: ui?.incomeCard.dimmed ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "var(--success-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowUp size={20} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{t("reports.summary.totalIncome")}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--success)", minHeight: "1.5rem" }}>
              {ui?.incomeCard.displayDash ? "—" : formatCurrency(totalIncome, { currency })}
            </div>
          </div>
        </div>
      </div>

      {/* Total de Saídas */}
      <div className="card" style={{ opacity: ui?.expenseCard.dimmed ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "var(--error-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowDown size={20} color="var(--error)" />
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{t("reports.summary.totalExpense")}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--error)", minHeight: "1.5rem" }}>
              {ui?.expenseCard.displayDash ? "—" : formatCurrency(totalExpense, { currency })}
            </div>
          </div>
        </div>
      </div>

      {/* Saldo do Período */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: isPositive ? "var(--success-light)" : "var(--error-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DollarSign size={20} color={isPositive ? "var(--success)" : "var(--error)"} />
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{t("reports.summary.balance")}</div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: isPositive ? "var(--success)" : "var(--error)",
              }}
            >
              {formatCurrency(balance, { currency })}
            </div>
          </div>
        </div>
      </div>

      {/* Variação Percentual */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: hasVariation
                ? isVariationPositive
                  ? "var(--success-light)"
                  : "var(--error-light)"
                : "var(--bg-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasVariation ? (
              isVariationPositive ? (
                <TrendingUp size={20} color="var(--success)" />
              ) : (
                <TrendingDown size={20} color="var(--error)" />
              )
            ) : (
              <DollarSign size={20} color="var(--text-secondary)" />
            )}
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {t("reports.summary.variation")}
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: hasVariation
                  ? isVariationPositive
                    ? "var(--success)"
                    : "var(--error)"
                  : "var(--text-secondary)",
              }}
            >
              {hasVariation ? (
                <>
                  {isVariationPositive ? "↑" : "↓"} {Math.abs(balanceVariationPercent).toFixed(1)}%
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disponível */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: isAvailablePositive ? "var(--success-light)" : "var(--error-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wallet size={20} color={isAvailablePositive ? "var(--success)" : "var(--error)"} />
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{t("reports.summary.available")}</div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: isAvailablePositive ? "var(--success)" : "var(--error)",
              }}
            >
              {formatCurrency(availableBalance, { currency })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

