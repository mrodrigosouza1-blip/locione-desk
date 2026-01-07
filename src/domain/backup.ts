import type { Account, Transaction, Category, Settings } from "./types";

export interface BackupFile {
  app: "leciondesk";
  version: 1;
  createdAt: string;
  settings: Settings;
  data: {
    accounts: Account[];
    transactions: Transaction[];
    categories?: Category[];
  };
  meta: {
    counts: {
      accounts: number;
      transactions: number;
      categories?: number;
    };
    currencies: string[];
    dateRange?: {
      min: string;
      max: string;
    };
  };
}

export function validateBackupFile(data: unknown): data is BackupFile {
  if (!data || typeof data !== "object") return false;
  const backup = data as any;
  
  if (backup.app !== "leciondesk") return false;
  if (backup.version !== 1) return false;
  if (!backup.createdAt || typeof backup.createdAt !== "string") return false;
  if (!backup.settings || typeof backup.settings !== "object") return false;
  if (!backup.data || typeof backup.data !== "object") return false;
  if (!Array.isArray(backup.data.accounts)) return false;
  if (!Array.isArray(backup.data.transactions)) return false;
  if (!backup.meta || typeof backup.meta !== "object") return false;
  
  return true;
}

