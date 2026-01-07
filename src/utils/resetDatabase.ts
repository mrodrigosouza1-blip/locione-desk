/**
 * Função para resetar o banco de dados completamente
 */

import { getDatabase, saveDatabaseAsync } from "../infra/database";
import { logger } from "./logger";

const DEFAULT_DATABASE = {
  accounts: [],
  transactions: [],
  categories: [
    {
      id: 1,
      name: "Sem categoria",
      icon: "tag",
      is_system: true,
      created_at: new Date().toISOString(),
    },
  ],
  creditCards: [],
  goals: [],
  goalMovements: [],
  budgets: [],
  settings: {
    currency: "BRL",
    date_format: "DD/MM/YYYY",
    theme: "light",
  },
};

/**
 * Reseta o banco de dados para o estado inicial
 * Mantém apenas as categorias padrão e settings básicos
 */
export async function resetDatabase(): Promise<void> {
  try {
    const db = getDatabase();
    
    // Limpar todos os dados, mantendo apenas estrutura básica
    db.accounts = [];
    db.transactions = [];
    db.creditCards = [];
    db.goals = [];
    db.goalMovements = [];
    db.budgets = [];
    
    // Manter categoria padrão "Sem categoria"
    db.categories = [
      {
        id: 1,
        name: "Sem categoria",
        icon: "tag",
        is_system: true,
        created_at: new Date().toISOString(),
      },
    ];
    
    // Manter settings básicos (não resetar configurações do usuário)
    if (!db.settings) {
      db.settings = DEFAULT_DATABASE.settings;
    }
    
    await saveDatabaseAsync();
    
    logger.infoTag("resetDatabase", "Banco de dados resetado com sucesso");
  } catch (error) {
    logger.errorTag("resetDatabase", "Erro ao resetar banco de dados:", error);
    throw error;
  }
}

