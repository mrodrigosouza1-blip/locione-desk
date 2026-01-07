import { PieChart, Tag } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { useI18n } from "../../i18n/I18nProvider";
import { CK } from "../../i18n/keys/chartsKeys";

interface CategoryPieChartProps {
  data: Array<{ categoryId: number; categoryName: string; amount: number; percent: number }>;
  currency: string;
}

export default function CategoryPieChart({ data, currency }: CategoryPieChartProps) {
  const { t } = useI18n();
  if (data.length === 0) {
    return (
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <PieChart size={24} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(CK.categoryPieChart.title)}</h2>
        </div>
        <div className="empty-state">
          <p>{t(CK.categoryPieChart.empty)}</p>
        </div>
      </div>
    );
  }

  // Cores para as categorias
  const colors = [
    "var(--error)",
    "var(--warning)",
    "var(--info)",
    "var(--success)",
    "var(--primary)",
    "#9b59b6",
    "#e74c3c",
    "#3498db",
    "#1abc9c",
    "#f39c12",
  ];

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Calcular ângulos para o gráfico de pizza
  let currentAngle = 0;
  const segments = data.map((item, index) => {
    const angle = (item.amount / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      color: colors[index % colors.length],
    };
  });

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <PieChart size={24} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(CK.categoryPieChart.title)}</h2>
      </div>
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        {/* Gráfico de pizza SVG */}
        <div style={{ flex: "0 0 200px" }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="var(--bg-secondary)" />
            {segments.map((segment) => {
              const startAngleRad = ((segment.startAngle - 90) * Math.PI) / 180;
              const endAngleRad = ((segment.endAngle - 90) * Math.PI) / 180;
              const x1 = 100 + 80 * Math.cos(startAngleRad);
              const y1 = 100 + 80 * Math.sin(startAngleRad);
              const x2 = 100 + 80 * Math.cos(endAngleRad);
              const y2 = 100 + 80 * Math.sin(endAngleRad);
              const largeArc = segment.endAngle - segment.startAngle > 180 ? 1 : 0;

              return (
                <path
                  key={segment.categoryId}
                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={segment.color}
                  stroke="var(--bg-primary)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        {/* Legenda */}
        <div style={{ flex: 1 }}>
          {data.map((item, index) => (
            <div
              key={item.categoryId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 0",
                borderBottom:
                  index < data.length - 1 ? "1px solid var(--border-color)" : "none",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  backgroundColor: colors[index % colors.length],
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Tag size={14} />
                    {item.categoryName}
                  </div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--error)" }}>
                    {formatCurrency(item.amount, { currency })}
                  </div>
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {item.percent.toFixed(1)} {t(CK.categoryPieChart.percentOfTotal)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

