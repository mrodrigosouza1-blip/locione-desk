/**
 * Helper compartilhado para calcular resumo de orçamentos.
 * Garante que Dashboard e BudgetsPage usem a mesma lógica.
 */

import { format } from "date-fns";
import { budgetRepository } from "../infra/repositories/budgetRepository";

export interface BudgetSummary {
  hasBudget: boolean;
  spentCents: number;
  budgetCents: number;
  remainingCents: number;
  percent: number;
  isOver: boolean;
  isCritical: boolean;
}

/**
 * Obtém o resumo do orçamento atual (mês atual).
 * Usa a mesma lógica da BudgetsPage:
 * - Busca orçamentos do mês atual (yyyy-MM)
 * - Calcula spent usando budgetRepository.getSpent (mesma função)
 * - Soma todos os orçamentos válidos (amount_cents > 0)
 * - Retorna hasBudget=false se não houver orçamentos válidos
 */
export async function getCurrentBudgetSummary(): Promise<BudgetSummary> {
  const currentMonth = format(new Date(), "yyyy-MM");
  const budgets = await budgetRepository.findAll(currentMonth);
  
  // Filtrar apenas orçamentos válidos (amount_cents > 0)
  const validBudgets = budgets.filter((b) => (b.amount_cents || 0) > 0);
  
  if (validBudgets.length === 0) {
    return {
      hasBudget: false,
      spentCents: 0,
      budgetCents: 0,
      remainingCents: 0,
      percent: 0,
      isOver: false,
      isCritical: false,
    };
  }
  
  // Calcular spent para cada orçamento (mesma lógica da BudgetsPage)
  const budgetsWithSpent = await Promise.all(
    validBudgets.map(async (budget) => {
      const spent = await budgetRepository.getSpent(budget.category_id, budget.month);
      return { ...budget, spent };
    })
  );
  
  // Somar todos os orçamentos (total geral)
  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalBudget = validBudgets.reduce((sum, b) => sum + (b.amount_cents || 0), 0);
  
  // Calcular estatísticas (mesma lógica da computeBudgetStats da BudgetsPage)
  const limit = totalBudget;
  const spent = totalSpent;
  const usage = limit > 0 ? spent / limit : 0;
  const remaining = limit - spent; // Pode ser negativo
  const percent = usage * 100;
  const isOver = usage > 1.0;
  const isCritical = usage >= 0.80 && usage <= 1.0;
  
  return {
    hasBudget: true,
    spentCents: spent,
    budgetCents: limit,
    remainingCents: remaining,
    percent,
    isOver,
    isCritical,
  };
}

