import { goalRepository } from "../../infra/repositories/goalRepository";
import type { Goal } from "../types";
import { logger } from "../../utils/logger";

export interface GoalBalance {
  goalId: number;
  balanceCents: number;
}

export interface CentralVault {
  currency_code: string;
  totalCents: number;
}

/**
 * Calcula o saldo atual de uma meta somando depósitos e subtraindo resgates
 */
export async function getGoalBalanceCents(goalId: number): Promise<number> {
  const movements = await goalRepository.getMovements(goalId);
  let balance = 0;
  
  for (const movement of movements) {
    if (movement.type === "deposit") {
      balance += movement.amount_cents;
    } else if (movement.type === "redeem") {
      balance -= movement.amount_cents;
    }
  }
  
  return Math.max(0, balance); // Não pode ser negativo
}

/**
 * Calcula o cofre central agrupando saldos de todas as metas por moeda
 * Usa deposited_amount das metas (recalcula para evitar drift)
 */
export async function getCentralVaultByCurrency(): Promise<CentralVault[]> {
  const goals = await goalRepository.findAll();
  const vaults: Record<string, number> = {};
  
  for (const goal of goals) {
    const deposited = goal.deposited_amount || 0;
    const currency = goal.currency_code || "BRL";
    
    if (!vaults[currency]) {
      vaults[currency] = 0;
    }
    vaults[currency] += deposited;
  }
  
  return Object.entries(vaults).map(([currency_code, totalCents]) => ({
    currency_code,
    totalCents,
  }));
}

/**
 * Sugere valor de depósito baseado no tipo e modo da meta
 */
export function suggestDepositAmount(goal: Goal, stepOrDay?: number): number {
  if (!goal.config) {
    return 0;
  }
  
  try {
    const config = typeof goal.config === "string" ? JSON.parse(goal.config) : goal.config;
    
    if (goal.type === "free") {
      // Meta livre: sem sugestão automática
      return 0;
    }
    
    if (goal.type === "steps" && stepOrDay !== undefined) {
      // Meta por passos
      if (config.mode === "fixed" && config.fixed_amount_cents) {
        return config.fixed_amount_cents;
      } else if (config.mode === "by_number") {
        // Valor = número do passo (convertido para centavos)
        return stepOrDay * 100;
      }
    }
    
    if (goal.type === "monthly" && stepOrDay !== undefined) {
      // Meta por mês
      if (config.mode === "fixed" && config.fixed_amount_cents) {
        return config.fixed_amount_cents;
      } else if (config.mode === "by_number") {
        // Valor = número do dia (convertido para centavos)
        return stepOrDay * 100;
      }
    }
  } catch (error) {
    logger.errorTag("goalService", "Erro ao calcular sugestão de depósito:", error);
  }
  
  return 0;
}

/**
 * Obtém o saldo total do cofre central para uma moeda específica
 */
export async function getCentralVaultForCurrency(currencyCode: string): Promise<number> {
  const vaults = await getCentralVaultByCurrency();
  const vault = vaults.find((v) => v.currency_code === currencyCode);
  return vault ? vault.totalCents : 0;
}

