// Utilitário para reparar o banco de dados

import { getDatabase, saveDatabaseAsync } from "../infra/database";

export interface RepairReport {
  fixed: string[];
  errors: string[];
}

export async function repairDatabase(): Promise<RepairReport> {
  const db = getDatabase();
  const report: RepairReport = { fixed: [], errors: [] };

  try {
    // Garantir que arrays existem
    if (!Array.isArray(db.accounts)) {
      db.accounts = [];
      report.fixed.push("Array 'accounts' criado");
    }
    if (!Array.isArray(db.transactions)) {
      db.transactions = [];
      report.fixed.push("Array 'transactions' criado");
    }
    if (!Array.isArray(db.categories)) {
      db.categories = [];
      report.fixed.push("Array 'categories' criado");
    }
    if (!Array.isArray(db.creditCards)) {
      db.creditCards = [];
      report.fixed.push("Array 'creditCards' criado");
    }
    if (!Array.isArray(db.goals)) {
      db.goals = [];
      report.fixed.push("Array 'goals' criado");
    }
    if (!Array.isArray(db.goalMovements)) {
      db.goalMovements = [];
      report.fixed.push("Array 'goalMovements' criado");
    }
    if (!Array.isArray(db.budgets)) {
      db.budgets = [];
      report.fixed.push("Array 'budgets' criado");
    }

    // Garantir categoria sistema "Sem categoria" id=1
    const systemCategory = db.categories.find((c: { id: number; name: string }) => c.id === 1 || c.name === "Sem categoria");
    if (!systemCategory) {
      db.categories.unshift({
        id: 1,
        name: "Sem categoria",
        icon: "tag",
        is_system: true,
        created_at: new Date().toISOString(),
      });
      report.fixed.push("Categoria sistema 'Sem categoria' criada");
    } else if (systemCategory.id !== 1) {
      // Garantir que tem id=1
      systemCategory.id = 1;
      systemCategory.name = "Sem categoria";
      systemCategory.is_system = true;
      if (!systemCategory.created_at) {
        systemCategory.created_at = new Date().toISOString();
      }
      report.fixed.push("Categoria sistema corrigida para id=1");
    }

    // Remover IDs inválidos (null, undefined, 0, negativo)
    const removedInvalid = {
      accounts: 0,
      transactions: 0,
      categories: 0,
      creditCards: 0,
      goals: 0,
      budgets: 0,
    };

    db.accounts = db.accounts.filter((a: { id: number }) => {
      if (!a || typeof a.id !== "number" || a.id <= 0) {
        removedInvalid.accounts++;
        return false;
      }
      return true;
    });

    db.transactions = db.transactions.filter((t: { id: number }) => {
      if (!t || typeof t.id !== "number" || t.id <= 0) {
        removedInvalid.transactions++;
        return false;
      }
      return true;
    });

    db.categories = db.categories.filter((c: { id: number }) => {
      if (!c || typeof c.id !== "number" || c.id <= 0) {
        removedInvalid.categories++;
        return false;
      }
      return true;
    });

    db.creditCards = db.creditCards.filter((cc: { id: number }) => {
      if (!cc || typeof cc.id !== "number" || cc.id <= 0) {
        removedInvalid.creditCards++;
        return false;
      }
      return true;
    });

    db.goals = db.goals.filter((g: { id: number }) => {
      if (!g || typeof g.id !== "number" || g.id <= 0) {
        removedInvalid.goals++;
        return false;
      }
      return true;
    });

    db.budgets = db.budgets.filter((b: { id: number }) => {
      if (!b || typeof b.id !== "number" || b.id <= 0) {
        removedInvalid.budgets++;
        return false;
      }
      return true;
    });

    Object.entries(removedInvalid).forEach(([key, count]) => {
      if (count > 0) {
        report.fixed.push(`${count} item(s) inválido(s) removido(s) de '${key}'`);
      }
    });

    // Remover duplicatas por ID (manter o mais recente baseado em updated_at ou created_at)
    const removeDuplicates = <T extends { id: number; updated_at?: string; created_at?: string }>(items: T[], name: string): T[] => {
      const seen = new Map<number, T>();
      let duplicates = 0;

      items.forEach((item: T) => {
        const existing = seen.get(item.id);
        if (existing) {
          duplicates++;
          const itemDate = item.updated_at || item.created_at || "";
          const existingDate = existing.updated_at || existing.created_at || "";
          if (itemDate > existingDate) {
            seen.set(item.id, item);
          }
        } else {
          seen.set(item.id, item);
        }
      });

      if (duplicates > 0) {
        report.fixed.push(`${duplicates} duplicata(s) removida(s) de '${name}'`);
        return Array.from(seen.values());
      }
      return items;
    };

    db.accounts = removeDuplicates(db.accounts, "accounts");
    db.transactions = removeDuplicates(db.transactions, "transactions");
    db.categories = removeDuplicates(db.categories, "categories");
    db.creditCards = removeDuplicates(db.creditCards, "creditCards");
    db.goals = removeDuplicates(db.goals, "goals");
    db.budgets = removeDuplicates(db.budgets, "budgets");

    // Garantir que settings existe
    if (!db.settings) {
      // Settings será criado pelo settingsRepository se necessário
      report.fixed.push("Settings será inicializado pelo settingsRepository");
    }

    // Salvar reparações
    await saveDatabaseAsync();

    return report;
  } catch (error) {
    report.errors.push(`Erro ao reparar banco: ${error instanceof Error ? error.message : String(error)}`);
    return report;
  }
}

