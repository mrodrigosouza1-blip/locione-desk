import { formatDateString } from "../../utils/format";
import { formatCurrency } from "../../utils/format";
import { BarChart3 } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { CK } from "../../i18n/keys/chartsKeys";

interface BalanceLineChartProps {
  data: Array<{ date: string; balance: number }>;
  currency: string;
}

export default function BalanceLineChart({ data, currency }: BalanceLineChartProps) {
  const { t } = useI18n();
  if (data.length === 0) {
    return (
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <BarChart3 size={24} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(CK.balanceLineChart.title)}</h2>
        </div>
        <div className="empty-state">
          <p>{t(CK.balanceLineChart.empty)}</p>
        </div>
      </div>
    );
  }

  const maxBalance = Math.max(...data.map((d) => Math.abs(d.balance)), 1);
  const minBalance = Math.min(...data.map((d) => d.balance), 0);
  const range = maxBalance - minBalance || 1;
  const chartHeight = 200;

  // Identificar quedas abruptas (mais de 20% de queda)
  const hasAbruptFall = data.some((d, i) => {
    if (i === 0) return false;
    const prev = data[i - 1].balance;
    const current = d.balance;
    const fall = prev - current;
    return fall > 0 && fall > Math.abs(prev) * 0.2;
  });

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <BarChart3 size={24} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(CK.balanceLineChart.title)}</h2>
        {hasAbruptFall && (
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.25rem 0.5rem",
              backgroundColor: "var(--error-light)",
              color: "var(--error)",
              borderRadius: "4px",
            }}
          >
            {t(CK.balanceLineChart.fallsDetected)}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: `${chartHeight}px`, padding: "1rem" }}>
        {data.map((item, index) => {
          const height = ((item.balance - minBalance) / range) * chartHeight;
          const isNegative = item.balance < 0;
          const isAbruptFall =
            index > 0 &&
            data[index - 1].balance > item.balance &&
            data[index - 1].balance - item.balance > Math.abs(data[index - 1].balance) * 0.2;

          return (
            <div
              key={item.date}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${height}px`,
                  backgroundColor: isAbruptFall
                    ? "var(--error)"
                    : isNegative
                    ? "var(--error-light)"
                    : "var(--success)",
                  borderRadius: "4px 4px 0 0",
                  minHeight: "4px",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                title={`${formatDateString(item.date)}: ${formatCurrency(item.balance, { currency })}`}
              />
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.5rem",
                  transform: "rotate(-45deg)",
                  transformOrigin: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDateString(item.date).split("/")[0]}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          {t(CK.balanceLineChart.initialBalance)}: {formatCurrency(data[0]?.balance || 0, { currency })}
        </div>
      </div>
    </div>
  );
}

