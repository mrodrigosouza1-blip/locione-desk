import { BarChart3, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { useI18n } from "../../i18n/I18nProvider";
import { CK } from "../../i18n/keys/chartsKeys";

interface InOutBarChartProps {
  totalIncome: number;
  totalExpense: number;
  currency: string;
}

export default function InOutBarChart({ totalIncome, totalExpense, currency }: InOutBarChartProps) {
  const { t } = useI18n();
  const maxValue = Math.max(totalIncome, totalExpense, 1);
  const chartHeight = 200;
  const barWidth = 80;

  const incomeHeight = (totalIncome / maxValue) * chartHeight;
  const expenseHeight = (totalExpense / maxValue) * chartHeight;
  const netHeight = ((totalIncome - totalExpense) / maxValue) * chartHeight;

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <BarChart3 size={24} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(CK.inOutBarChart.title)}</h2>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "2rem",
          height: `${chartHeight}px`,
          padding: "1rem",
        }}
      >
        {/* Entradas */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: `${barWidth}px`,
              height: `${incomeHeight}px`,
              backgroundColor: "var(--success)",
              borderRadius: "4px 4px 0 0",
              minHeight: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
            title={`${t(CK.inOutBarChart.income)}: ${formatCurrency(totalIncome, { currency })}`}
          >
            {incomeHeight > 30 && formatCurrency(totalIncome, { currency })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <ArrowUp size={16} color="var(--success)" />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t(CK.inOutBarChart.income)}</span>
          </div>
        </div>

        {/* Saídas */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: `${barWidth}px`,
              height: `${expenseHeight}px`,
              backgroundColor: "var(--error)",
              borderRadius: "4px 4px 0 0",
              minHeight: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
            title={`${t(CK.inOutBarChart.expense)}: ${formatCurrency(totalExpense, { currency })}`}
          >
            {expenseHeight > 30 && formatCurrency(totalExpense, { currency })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <ArrowDown size={16} color="var(--error)" />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t(CK.inOutBarChart.expense)}</span>
          </div>
        </div>

        {/* Resultado Líquido */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: `${barWidth}px`,
              height: `${Math.abs(netHeight)}px`,
              backgroundColor: netHeight >= 0 ? "var(--success)" : "var(--error)",
              borderRadius: "4px 4px 0 0",
              minHeight: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
            title={`${t(CK.inOutBarChart.result)}: ${formatCurrency(totalIncome - totalExpense, { currency })}`}
          >
            {Math.abs(netHeight) > 30 && formatCurrency(totalIncome - totalExpense, { currency })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t(CK.inOutBarChart.result)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

