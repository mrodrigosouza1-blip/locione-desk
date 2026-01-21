import { useEffect, useState } from "react";
import { budgetRepository } from "../../infra/repositories/budgetRepository";
import { categoryRepository } from "../../infra/repositories/categoryRepository";
import { formatMoneyWithSecondary } from "../../utils/format";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import MoneyDisplay from "../components/MoneyDisplay";
import { parseMoneyInput, formatMoneyInput, cleanMoneyInput, getMoneyPlaceholder } from "../utils/moneyInput";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import { Plus, PieChart, Edit, Trash2, AlertCircle, Filter } from "lucide-react";
import { format } from "date-fns";
import { useI18n } from "../../i18n/I18nProvider";
import { BK } from "../../i18n/keys/budgetsKeys";
import { useToast } from "../hooks/useToast";
import { getUsageCounters } from "../../services/usageCounters";
import { checkGate } from "../../services/planGate";
import { requireGate } from "../../services/requireGate";
import PremiumTag from "../components/PremiumTag";
import EmptyState from "../../shared/components/EmptyState";
import { illustrations } from "../../assets/illustrations";

export default function BudgetsPage() {
  const { t } = useI18n();
  const toast = useToast();
  
  // Preview Premium: FREE pode ver orçamentos, mas ações premium são bloqueadas
  const counters = getUsageCounters();
  const gateResult = checkGate("budgets.access", counters);
  const isBudgetsPremium = gateResult.ok;
  const [budgets, setBudgets] = useState<any[]>([]);
  const [budgetsWithSpent, setBudgetsWithSpent] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [formData, setFormData] = useState({
    category_id: 0,
    month: format(new Date(), "yyyy-MM"),
    amount_cents: "" as number | string,
  });
  const [settings] = useState(() => {
    try {
      return settingsRepository.get();
    } catch {
      return { currency: "BRL", date_format: "DD/MM/YYYY", theme: "light" as const };
    }
  });
  const [fullSettings] = useState(() => {
    try {
      return settingsRepository.getSettings();
    } catch {
      return null;
    }
  });
  const locale = fullSettings?.preferences.locale ?? "pt-BR";

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, []);

  useEffect(() => {
    if (budgets.length > 0) {
      loadBudgetsWithSpent();
    }
  }, [budgets]);

  // Função para calcular estatísticas do orçamento (criticidade automática)
  function computeBudgetStats(budget: any): {
    spent: number;
    limit: number;
    usage: number;
    remaining: number;
    isCritical: boolean;
    isOver: boolean;
  } {
    const limit = budget.amount_cents;
    const spent = budget.spent || 0;
    const usage = limit > 0 ? spent / limit : 0;
    const remaining = Math.max(0, limit - spent);
    const isCritical = usage >= 0.80 && usage <= 1.0;
    const isOver = usage > 1.0;

    return {
      spent,
      limit,
      usage,
      remaining,
      isCritical,
      isOver,
    };
  }

  async function loadBudgets() {
    const currentMonth = format(new Date(), "yyyy-MM");
    const loaded = await budgetRepository.findAll(currentMonth);
    setBudgets(loaded);
  }

  async function loadCategories() {
    setCategories(await categoryRepository.findAll());
  }

  async function loadBudgetsWithSpent() {
    const budgetsWithData = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await budgetRepository.getSpent(budget.category_id, budget.month);
        return { ...budget, spent };
      })
    );
    setBudgetsWithSpent(budgetsWithData);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Bloquear ações premium no FREE
    if (!isBudgetsPremium) {
      requireGate("budgets.access", counters, toast, undefined, t);
      return;
    }
    
    // Converter string para centavos no submit
    const amountCents = typeof formData.amount_cents === "string" 
      ? parseMoneyInput(formData.amount_cents)
      : formData.amount_cents;
    
    if (editingBudgetId) {
      // Editar orçamento existente
      await budgetRepository.update(editingBudgetId, {
        category_id: formData.category_id,
        month: formData.month,
        amount_cents: amountCents,
      });
      setEditingBudgetId(null);
    } else {
      // Criar novo orçamento
      await budgetRepository.create({
        category_id: formData.category_id,
        month: formData.month,
        amount_cents: amountCents,
      });
    }
    setIsModalOpen(false);
    setFormData({
      category_id: 0,
      month: format(new Date(), "yyyy-MM"),
      amount_cents: "",
    });
    await loadBudgets();
  }

  function handleEdit(budget: any) {
    // Bloquear edição no FREE
    if (!isBudgetsPremium) {
      requireGate("budgets.access", counters, toast, undefined, t);
      return;
    }
    
    setEditingBudgetId(budget.id);
    setFormData({
      category_id: budget.category_id,
      month: budget.month,
      amount_cents: budget.amount_cents ? formatMoneyInput(budget.amount_cents) : "",
    });
    setIsModalOpen(true);
  }

  async function handleDelete(budgetId: number) {
    // Bloquear exclusão no FREE
    if (!isBudgetsPremium) {
      requireGate("budgets.access", counters, toast, undefined, t);
      return;
    }
    
    // Usar modal de confirmação simples (sem opções)
    const confirmed = window.confirm(t(BK.messages.deleteConfirm));
    if (!confirmed) return;
    
    try {
      await budgetRepository.delete(budgetId);
      toast.success(t(BK.messages.deleteSuccess) || "Orçamento excluído com sucesso");
      await loadBudgets();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(BK.messages.deleteError);
      toast.error(msg);
    }
  }


  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingBudgetId(null);
    setFormData({
      category_id: 0,
      month: format(new Date(), "yyyy-MM"),
      amount_cents: 0,
    });
  }

  return (
    <>
      <Topbar
        title={
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {t(BK.title)}
            <PremiumTag title={t("gate.budgets.message")} />
          </span>
        }
        subtitle={t(BK.subtitle)}
        primaryAction={{
          label: (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {t(BK.newBudget)}
              {!isBudgetsPremium && (
                <PremiumTag title={t("gate.budgets.message")} />
              )}
            </span>
          ),
          onClick: () => {
            if (!isBudgetsPremium) {
              requireGate("budgets.access", counters, toast, undefined, t);
              return;
            }
            setIsModalOpen(true);
          },
          icon: <Plus size={16} />,
          variant: "primary",
          disabled: !isBudgetsPremium,
          title: !isBudgetsPremium ? t("gate.budgets.message") : undefined,
        }}
        secondaryAction={
          budgets.length > 1
            ? {
                label: showCriticalOnly ? t(BK.filters.showAll) : t(BK.filters.showCritical),
                onClick: () => setShowCriticalOnly(!showCriticalOnly),
                icon: <Filter size={16} />,
                variant: "secondary",
              }
            : undefined
        }
        showLockNow={true}
      />
      <div className="content-area">

        {(() => {
          // Calcular estatísticas para cada orçamento
          const budgetsWithStats = budgetsWithSpent.map((budget: any) => ({
            ...budget,
            stats: computeBudgetStats(budget),
          }));

          // Filtrar e ordenar conforme filtro
          let visibleBudgets = budgetsWithStats;
          if (showCriticalOnly) {
            visibleBudgets = budgetsWithStats.filter(
              (b: any) => b.stats.isCritical || b.stats.isOver
            );
            // Ordenar por usage DESC (mais crítico primeiro)
            visibleBudgets.sort((a: any, b: any) => b.stats.usage - a.stats.usage);
          }

          if (!budgets || budgets.length === 0) {
            return (
              <EmptyState
                image={illustrations.empty.budgets}
                title={t(BK.empty.title)}
                description={!isBudgetsPremium ? t("gate.budgets.message") : undefined}
              />
            );
          }

          if (showCriticalOnly && visibleBudgets.length === 0) {
            return (
              <div className="card">
                <div className="empty-state">
                  <AlertCircle size={48} className="empty-state-icon" />
                  <p>{t(BK.empty.noCritical)}</p>
                </div>
              </div>
            );
          }

          return (
            <div className="grid grid-3">
              {visibleBudgets.map((budget: any) => {
                const category = categories.find((c) => c.id === budget.category_id);
                const stats = budget.stats;
                const percentage = stats.usage * 100;

                return (
                  <div
                    key={budget.id}
                    className="card"
                    style={{
                      borderLeft: `4px solid ${stats.isOver || stats.isCritical ? "var(--error)" : "var(--accent-primary)"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                        <PieChart size={20} />
                        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>
                          {category?.name || t(BK.display.categoryNotFound)}
                        </h3>
                        {stats.isOver && (
                          <span style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                            background: "var(--error)",
                            color: "white",
                            borderRadius: "4px",
                            fontWeight: 600
                          }}>
                            {t(BK.display.over)}
                          </span>
                        )}
                        {stats.isCritical && !stats.isOver && (
                          <span style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                            background: "var(--error)",
                            color: "white",
                            borderRadius: "4px",
                            fontWeight: 600
                          }}>
                            {t(BK.display.critical)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ 
                            padding: "0.25rem", 
                            fontSize: "0.75rem",
                            opacity: !isBudgetsPremium ? 0.5 : 1,
                            cursor: !isBudgetsPremium ? "not-allowed" : "pointer",
                          }}
                          onClick={() => handleEdit(budget)}
                          title={!isBudgetsPremium ? t("gate.budgets.message") : t(BK.actions.edit)}
                          disabled={!isBudgetsPremium}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ 
                            padding: "0.25rem", 
                            fontSize: "0.75rem", 
                            color: "var(--error)",
                            opacity: !isBudgetsPremium ? 0.5 : 1,
                            cursor: !isBudgetsPremium ? "not-allowed" : "pointer",
                          }}
                          onClick={() => handleDelete(budget.id)}
                          title={!isBudgetsPremium ? t("gate.budgets.message") : t(BK.actions.delete)}
                          disabled={!isBudgetsPremium}
                        >
                          <Trash2 size={14} />
                        </button>
                        {!isBudgetsPremium && (
                          <PremiumTag title={t("gate.budgets.message")} />
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                        {t(BK.display.spent)}
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 500 }}>
                        {(() => {
                          const spent = formatMoneyWithSecondary(stats.spent, settings.currency, fullSettings || undefined);
                          const limit = formatMoneyWithSecondary(stats.limit, settings.currency, fullSettings || undefined);
                          return (
                            <div>
                              <div>{spent.primary} / {limit.primary}</div>
                              {(spent.secondary || limit.secondary) && (
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                                  ≈ {spent.secondary || spent.primary} / {limit.secondary || limit.primary}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    {stats.remaining > 0 && (
                      <div style={{ marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        {t(BK.display.remaining)}:{" "}
                        <MoneyDisplay
                          amountCents={stats.remaining}
                          currencyCode={settings.currency}
                          settings={fullSettings}
                          primaryStyle={{ display: "inline" }}
                          secondaryStyle={{ display: "inline", marginLeft: "0.25rem" }}
                        />
                      </div>
                    )}
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{
                        height: "8px",
                        background: "var(--bg-tertiary)",
                        borderRadius: "4px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(percentage, 100)}%`,
                          background: stats.isOver || stats.isCritical ? "var(--error)" : "var(--accent-primary)",
                          transition: "width 0.3s"
                        }} />
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        {percentage.toFixed(1)}% {t(BK.display.used)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingBudgetId ? t(BK.modals.edit.title) : t(BK.modals.create.title)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">{t(BK.fields.category)}</label>
              <select
                className="input"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                required
              >
                <option value="">{t(BK.fields.selectCategory)}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">{t(BK.fields.month)}</label>
              <input
                className="input"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">{t(BK.fields.budgetValue)} ({settings.currency})</label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={typeof formData.amount_cents === "string" ? formData.amount_cents : formatMoneyInput(formData.amount_cents)}
                onChange={(e) => {
                  const cleaned = cleanMoneyInput(e.target.value);
                  setFormData({ ...formData, amount_cents: cleaned });
                }}
                placeholder={getMoneyPlaceholder(settings.currency, locale)}
                required
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                {t(BK.actions.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {editingBudgetId ? t(BK.actions.save) : t(BK.actions.create)}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}


