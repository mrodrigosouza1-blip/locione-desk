/**
 * Contadores de uso para validação de limites do plano FREE
 */

import { getDatabase } from "../infra/database";

export interface GateContext {
  totalTransactions: number;
  accountTransactions: number;
  cardTransactions: number;
  accountsCount: number;
  creditCardsCount: number;
  categoriesCount: number;
  goalsCount: number;
}

/**
 * Obtém os contadores de uso atuais
 */
export function getUsageCounters(): GateContext {
  try {
    const db = getDatabase();
    
    const transactions = db.transactions || [];
    const accounts = db.accounts || [];
    const creditCards = db.creditCards || [];
    const categories = db.categories || [];
    const goals = db.goals || [];
    
    // Contar transações por tipo
    const accountTransactions = transactions.filter(
      (t: any) => t.account_id && !t.credit_card_id
    ).length;
    
    const cardTransactions = transactions.filter(
      (t: any) => t.credit_card_id
    ).length;
    
    return {
      totalTransactions: transactions.length,
      accountTransactions,
      cardTransactions,
      accountsCount: accounts.length,
      creditCardsCount: creditCards.length,
      categoriesCount: categories.length,
      goalsCount: goals.length,
    };
  } catch (error) {
    // Em caso de erro, retornar zeros (permitir operação)
    return {
      totalTransactions: 0,
      accountTransactions: 0,
      cardTransactions: 0,
      accountsCount: 0,
      creditCardsCount: 0,
      categoriesCount: 0,
      goalsCount: 0,
    };
  }
}

