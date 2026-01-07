import { accountRepository } from "../infra/repositories/accountRepository";
import { transactionRepository } from "../infra/repositories/transactionRepository";
import { categoryRepository } from "../infra/repositories/categoryRepository";
import { settingsRepository } from "../infra/repositories/settingsRepository";
import type { BackupFile } from "../domain/backup";

export async function restoreBackup(backup: BackupFile): Promise<void> {
  // Limpar dados existentes
  await accountRepository.clear();
  await transactionRepository.clear();
  await categoryRepository.clear();

  // Restaurar dados do backup
  if (backup.data.accounts.length > 0) {
    await accountRepository.replaceAll(backup.data.accounts);
  }

  if (backup.data.transactions.length > 0) {
    await transactionRepository.replaceAll(backup.data.transactions);
  }

  if (backup.data.categories && backup.data.categories.length > 0) {
    await categoryRepository.replaceAll(backup.data.categories);
  }

  // Restaurar settings
  await settingsRepository.setSettings(backup.settings);

  // Aplicar tema imediatamente
  if (backup.settings.theme) {
    document.documentElement.setAttribute("data-theme", backup.settings.theme);
  }
}

