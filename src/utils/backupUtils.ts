import { accountRepository } from "../infra/repositories/accountRepository";
import { transactionRepository } from "../infra/repositories/transactionRepository";
import { categoryRepository } from "../infra/repositories/categoryRepository";
import { settingsRepository } from "../infra/repositories/settingsRepository";
import type { BackupFile } from "../domain/backup";
import { format } from "date-fns";

export async function createBackup(): Promise<BackupFile> {
  const [accounts, transactions, categories, settings] = await Promise.all([
    accountRepository.findAll(),
    transactionRepository.findAll(),
    categoryRepository.findAll(),
    Promise.resolve(settingsRepository.get()),
  ]);

  // Calcular moedas presentes
  const currencies = new Set<string>();
  accounts.forEach((a) => currencies.add(a.currency_code || "BRL"));
  transactions.forEach((t) => {
    const account = accounts.find((a) => a.id === t.account_id);
    if (account) {
      currencies.add(account.currency_code || "BRL");
    }
  });

  // Calcular intervalo de datas
  let dateRange: { min: string; max: string } | undefined;
  if (transactions.length > 0) {
    const dates = transactions.map((t) => t.date).sort();
    dateRange = {
      min: dates[0],
      max: dates[dates.length - 1],
    };
  }

  const backup: BackupFile = {
    app: "leciondesk",
    version: 1,
    createdAt: new Date().toISOString(),
    settings,
    data: {
      accounts,
      transactions,
      categories: categories.filter((c) => !c.is_system), // Excluir categorias do sistema
    },
    meta: {
      counts: {
        accounts: accounts.length,
        transactions: transactions.length,
        categories: categories.filter((c) => !c.is_system).length,
      },
      currencies: Array.from(currencies).sort(),
      dateRange,
    },
  };

  return backup;
}

export function getBackupFilename(): string {
  const now = new Date();
  const dateStr = format(now, "yyyy-MM-dd-HH-mm");
  return `leciondesk-backup-${dateStr}.json`;
}

