import { Lightbulb } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { useI18n } from "../../i18n/I18nProvider";

interface ReportInsightsProps {
  expensesByCategory: Array<{ categoryId: number; categoryName: string; amount: number; percent: number }>;
  totalExpense: number;
  balance: number;
  balanceVariation: number;
  balanceVariationPercent: number;
  currency: string;
}

export default function ReportInsights({
  expensesByCategory,
  balance,
  balanceVariation,
  balanceVariationPercent,
  currency,
}: ReportInsightsProps) {
  const { t } = useI18n();
  if (expensesByCategory.length === 0) {
    return (
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <Lightbulb size={24} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t("reports.insights.title")}</h2>
        </div>
        <div className="empty-state">
          <p>{t("reports.insights.empty")}</p>
        </div>
      </div>
    );
  }

  // Encontrar categoria que mais impactou
  const topCategory = expensesByCategory[0];
  const topCategoryPercent = topCategory?.percent || 0;

  // Gerar insights
  const insights: string[] = [];

  // Insight sobre categoria principal
  if (topCategory) {
    const impactText =
      topCategoryPercent > 30
        ? t("reports.insights.impactSignificant")
        : topCategoryPercent > 15
        ? t("reports.insights.impactRelevant")
        : t("reports.insights.impactParticipation");
    insights.push(
      t("reports.insights.periodSelected", {
        category: topCategory.categoryName,
        impact: impactText,
        percent: topCategoryPercent.toFixed(1),
        amount: formatCurrency(topCategory.amount, { currency }),
      })
    );
  }

  // Insight sobre saldo
  if (balance > 0) {
    if (balanceVariation > 0) {
      insights.push(
        t("reports.insights.positiveBalance", {
          amount: formatCurrency(balance, { currency }),
          percent: Math.abs(balanceVariationPercent).toFixed(1),
        })
      );
    } else if (balanceVariation < 0) {
      insights.push(
        t("reports.insights.positiveBalanceLower", {
          amount: formatCurrency(balance, { currency }),
          percent: Math.abs(balanceVariationPercent).toFixed(1),
        })
      );
    } else {
      insights.push(
        t("reports.insights.positiveBalanceSimple", { amount: formatCurrency(balance, { currency }) })
      );
    }
  } else if (balance < 0) {
    if (balanceVariation < 0) {
      insights.push(
        t("reports.insights.negativeBalance", {
          amount: formatCurrency(Math.abs(balance), { currency }),
          percent: Math.abs(balanceVariationPercent).toFixed(1),
        })
      );
    } else {
      insights.push(
        t("reports.insights.negativeBalanceImproved", {
          amount: formatCurrency(Math.abs(balance), { currency }),
        })
      );
    }
  } else {
    insights.push(t("reports.insights.balanced", { amount: formatCurrency(balance, { currency }) }));
  }

  // Insight sobre distribuição de gastos
  if (expensesByCategory.length > 1) {
    const secondCategory = expensesByCategory[1];
    if (secondCategory && secondCategory.percent > 10) {
      insights.push(
        t("reports.insights.distribution", {
          cat1: topCategory.categoryName,
          p1: topCategoryPercent.toFixed(1),
          cat2: secondCategory.categoryName,
          p2: secondCategory.percent.toFixed(1),
        })
      );
    }
  }

  // Se não houver insights suficientes, adicionar um genérico
  if (insights.length === 0) {
    insights.push(t("reports.insights.generic"));
  }

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <Lightbulb size={24} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t("reports.insights.title")}</h2>
      </div>
      <div style={{ lineHeight: "1.8" }}>
        {insights.map((insight, index) => (
          <p key={index} style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>
            {insight}
          </p>
        ))}
      </div>
    </div>
  );
}

