// Helper para confirmação antes de deletar

import { settingsRepository } from "../infra/repositories/settingsRepository";
import { getI18n } from "../i18n/I18nProvider";
import { AK } from "../i18n/keys/appKeys";

export async function confirmDelete(
  itemName: string,
  onConfirm: () => void | Promise<void>
): Promise<void> {
  const settings = settingsRepository.getSettings();
  
  if (!settings.security.confirmBeforeDelete) {
    await onConfirm();
    return;
  }
  
  // Em uma implementação completa, isso abriria um modal
  // Por enquanto, usar confirm nativo
  const { t } = getI18n();
  const confirmed = window.confirm(
    t(AK.confirmDelete.message, { itemName })
  );
  
  if (confirmed) {
    await onConfirm();
  }
}

