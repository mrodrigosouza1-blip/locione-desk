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
  totalExpense,
  currency,
}: ReportInsightsProps) {
  const { t } = useI18n();
  function hashString(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function pickVariant(keys: string[], seed: string) {
    if (keys.length === 1) return keys[0];
    const idx = hashString(seed) % keys.length;
    return keys[idx];
  }

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
  const seedBase = `${topCategory?.categoryId || "none"}-${currency}-${Math.round(balanceVariationPercent)}`;

  // Gerar insights
  const insights: string[] = [];

  // Insight sobre categoria principal
  if (topCategory) {
    const impactText =
      topCategoryPercent > 30
        ? t(pickVariant(["reports.insights.impactSignificant", "reports.insights.impactSignificantAlt"], `${seedBase}-impact-strong`))
        : topCategoryPercent > 15
        ? t(pickVariant(["reports.insights.impactRelevant", "reports.insights.impactRelevantAlt"], `${seedBase}-impact-mid`))
        : t(pickVariant(["reports.insights.impactParticipation", "reports.insights.impactParticipationAlt"], `${seedBase}-impact-low`));
    insights.push(
      t(pickVariant(["reports.insights.periodSelected", "reports.insights.periodSelectedAlt"], `${seedBase}-period`), {
        category: topCategory.categoryName,
        impact: impactText,
        percent: topCategoryPercent.toFixed(1),
        amount: formatCurrency(topCategory.amount, { currency }),
      })
    );
  }

  if (topCategoryPercent >= 40) {
    insights.push(
      t(pickVariant(["reports.insights.highConcentration", "reports.insights.highConcentrationAlt"], `${seedBase}-concentration`), {
        category: topCategory.categoryName,
        percent: topCategoryPercent.toFixed(1),
        amount: formatCurrency(topCategory.amount, { currency }),
      })
    );
  }

  // Insight sobre saldo
  if (balance > 0) {
    if (balanceVariation > 0) {
      insights.push(
        t(pickVariant(["reports.insights.positiveBalance", "reports.insights.positiveBalanceAlt"], `${seedBase}-pos-up`), {
          amount: formatCurrency(balance, { currency }),
          percent: Math.abs(balanceVariationPercent).toFixed(1),
        })
      );
    } else if (balanceVariation < 0) {
      insights.push(
        t(pickVariant(["reports.insights.positiveBalanceLower", "reports.insights.positiveBalanceLowerAlt"], `${seedBase}-pos-down`), {
          amount: formatCurrency(balance, { currency }),
          percent: Math.abs(balanceVariationPercent).toFixed(1),
        })
      );
    } else {
      insights.push(
        t(pickVariant(["reports.insights.positiveBalanceSimple", "reports.insights.positiveBalanceSimpleAlt"], `${seedBase}-pos-flat`), { amount: formatCurrency(balance, { currency }) })
      );
    }
  } else if (balance < 0) {
    if (balanceVariation < 0) {
      insights.push(
        t(pickVariant(["reports.insights.negativeBalance", "reports.insights.negativeBalanceAlt"], `${seedBase}-neg-down`), {
          amount: formatCurrency(Math.abs(balance), { currency }),
          percent: Math.abs(balanceVariationPercent).toFixed(1),
        })
      );
    } else {
      insights.push(
        t(pickVariant(["reports.insights.negativeBalanceImproved", "reports.insights.negativeBalanceImprovedAlt"], `${seedBase}-neg-up`), {
          amount: formatCurrency(Math.abs(balance), { currency }),
        })
      );
    }
  } else {
    insights.push(t(pickVariant(["reports.insights.balanced", "reports.insights.balancedAlt"], `${seedBase}-balanced`), { amount: formatCurrency(balance, { currency }) }));
  }

  if (totalExpense > 0 && balance < 0) {
    insights.push(
      t(pickVariant(["reports.insights.expenseOverIncome", "reports.insights.expenseOverIncomeAlt"], `${seedBase}-over`), {
        amount: formatCurrency(Math.abs(balance), { currency }),
      })
    );
  }

  if (Math.abs(balanceVariationPercent) >= 20) {
    insights.push(
      t(
        pickVariant(
          balanceVariation > 0
            ? ["reports.insights.balanceChangeUp", "reports.insights.balanceChangeUpAlt"]
            : ["reports.insights.balanceChangeDown", "reports.insights.balanceChangeDownAlt"],
          `${seedBase}-variation`
        ),
        { percent: Math.abs(balanceVariationPercent).toFixed(1) }
      )
    );
  }

  // Insight sobre distribuição de gastos
  if (expensesByCategory.length > 1) {
    const secondCategory = expensesByCategory[1];
    if (secondCategory && secondCategory.percent > 10) {
      insights.push(
        t(pickVariant(["reports.insights.distribution", "reports.insights.distributionAlt"], `${seedBase}-distribution`), {
          cat1: topCategory.categoryName,
          p1: topCategoryPercent.toFixed(1),
          cat2: secondCategory.categoryName,
          p2: secondCategory.percent.toFixed(1),
        })
      );
    }
  }

  if (expensesByCategory.length >= 3 && topCategoryPercent < 25) {
    insights.push(t(pickVariant(["reports.insights.diversified", "reports.insights.diversifiedAlt"], `${seedBase}-diverse`)));
  }

  // Se não houver insights suficientes, adicionar um genérico
  if (insights.length === 0) {
    insights.push(t(pickVariant(["reports.insights.generic", "reports.insights.genericAlt"], `${seedBase}-generic`)));
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

