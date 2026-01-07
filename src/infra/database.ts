import type { Database, Account } from "../domain/types";
import { logger } from "../utils/logger";

let dbCache: Database | null = null;
let savePending = false;

const DEFAULT_DATABASE: Database = {
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

async function loadDatabase(): Promise<Database> {
  if (typeof window !== "undefined" && (window as any).electronAPI) {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI.readAppDataJson) {
        const content = await electronAPI.readAppDataJson("database.json");
        if (content) {
          return JSON.parse(content);
        }
      }
    } catch (error) {
      logger.warnTag("database", "Erro ao carregar database via Electron API:", error);
    }
  }

  // Fallback: usar localStorage
  try {
    const stored = localStorage.getItem("leciondesk_database");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logger.warnTag("database", "Erro ao carregar database do localStorage:", error);
  }

  return DEFAULT_DATABASE;
}

async function saveDatabase(db: Database): Promise<void> {
  const content = JSON.stringify(db, null, 2);

  if (typeof window !== "undefined" && (window as any).electronAPI) {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI.writeAppDataJson) {
        await electronAPI.writeAppDataJson("database.json", content);
        return;
      }
    } catch (error) {
      logger.warnTag("database", "Erro ao salvar database via Electron API:", error);
    }
  }

  // Fallback: usar localStorage
  try {
    localStorage.setItem("leciondesk_database", content);
  } catch (error) {
    logger.errorTag("database", "Erro ao salvar database no localStorage:", error);
    throw error;
  }
}

export function getDatabase(): Database {
  if (!dbCache) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return dbCache;
}

export async function saveDatabaseAsync(): Promise<void> {
  if (!dbCache) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }

  if (savePending) {
    return;
  }

  savePending = true;
  try {
    await saveDatabase(dbCache);
  } finally {
    savePending = false;
  }
}

export async function initDatabase(): Promise<void> {
  try {
    await (window as any).electronAPI?.ensureAppDataDir();
  } catch (error) {
    logger.warnTag("database", "Erro ao garantir diretório de dados:", error);
  }

  dbCache = await loadDatabase();

  // Garantir que sempre existe categoria "Sem categoria"
  if (!dbCache.categories.find((c: { id: number; name: string }) => c.id === 1 || c.name === "Sem categoria")) {
    dbCache.categories.unshift({
      id: 1,
      name: "Sem categoria",
      icon: "tag",
      is_system: true,
      created_at: new Date().toISOString(),
    });
  }

  // Garantir que sempre existe settings
  if (!dbCache.settings) {
    dbCache.settings = DEFAULT_DATABASE.settings;
  }

  // Garantir que arrays existem
  if (!dbCache.accounts) dbCache.accounts = [];
  if (!dbCache.transactions) dbCache.transactions = [];
  if (!dbCache.categories) dbCache.categories = [];
  if (!dbCache.creditCards) dbCache.creditCards = [];
  if (!dbCache.goals) dbCache.goals = [];
  if (!dbCache.goalMovements) dbCache.goalMovements = [];
  if (!dbCache.budgets) dbCache.budgets = [];

  await saveDatabaseAsync();
}

export async function getOrCreateMetaVaultAccount(currency: string): Promise<Account> {
  const db = getDatabase();
  const vaultName = `Cofre Metas ${currency}`;
  
  let vaultAccount = db.accounts.find(
    (acc: Account) => acc.is_system === true && acc.name === vaultName
  );

  if (!vaultAccount) {
    const newId = db.accounts.length > 0 ? Math.max(...db.accounts.map((a: Account) => a.id)) + 1 : 1;
    vaultAccount = {
      id: newId,
      name: vaultName,
      type: "savings",
      currency_code: currency,
      initial_balance_cents: 0,
      is_system: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.accounts.push(vaultAccount);
    await saveDatabaseAsync();
  }

  return vaultAccount;
}
