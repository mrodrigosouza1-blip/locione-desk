/**
 * Helper para verificar e bloquear features baseado na licença
 */

import { isFeatureEnabled, canCreateAccount, canCreateCreditCard, canCreateCategory, canCreateGoal, canCreateTransaction, canCreateAccountTransaction, canCreateCardTransaction, isPro } from "../services/licenseService";
import type { FeatureKey } from "../domain/license";
import { useToast } from "../ui/hooks/useToast";
import { useI18n } from "../i18n/I18nProvider";

/**
 * Mensagens de bloqueio por feature
 */
const BLOCK_MESSAGES: Record<FeatureKey, string> = {
  EXPORT_PDF: "about.license.exportPdfBlocked",
  BACKUP_RESTORE: "about.license.backupBlocked",
  MULTIPLE_ACCOUNTS: "about.license.multipleAccountsBlocked",
  UNLIMITED_TRANSACTIONS: "about.license.unlimitedTransactionsBlocked",
  ADVANCED_REPORTS: "about.license.advancedReportsBlocked",
};

/**
 * Hook para verificar feature e mostrar toast se bloqueado
 */
export function useRequireFeature() {
  const toast = useToast();
  const { t } = useI18n();

  function requireFeature(feature: FeatureKey): boolean {
    if (isFeatureEnabled(feature)) {
      return true;
    }

    // Feature bloqueada - mostrar toast
    const messageKey = BLOCK_MESSAGES[feature];
    toast.warning(t(messageKey) || "Este recurso está disponível no plano Pro");
    return false;
  }

  function requireAccountCreation(currentCount?: number): boolean {
    if (canCreateAccount(currentCount)) {
      return true;
    }

    toast.warning(t("about.license.multipleAccountsBlocked") || "Limite do plano Free atingido. Desbloqueie no plano anual ou vitalício.");
    return false;
  }

  function requireCreditCardCreation(currentCount?: number): boolean {
    if (canCreateCreditCard(currentCount)) {
      return true;
    }

    toast.warning(t("about.license.multipleCreditCardsBlocked") || "Limite do plano Free atingido. Desbloqueie no plano anual ou vitalício.");
    return false;
  }

  function requireCategoryCreation(currentCount?: number): boolean {
    if (canCreateCategory(currentCount)) {
      return true;
    }

    toast.warning(t("about.license.multipleCategoriesBlocked") || "Limite do plano Free atingido. Desbloqueie no plano anual ou vitalício.");
    return false;
  }

  function requireGoalCreation(currentCount?: number): boolean {
    if (canCreateGoal(currentCount)) {
      return true;
    }

    toast.warning(t("about.license.multipleGoalsBlocked") || "Limite do plano Free atingido. Desbloqueie no plano anual ou vitalício.");
    return false;
  }

  function requireTransactionCreation(totalCount?: number): boolean {
    if (canCreateTransaction(totalCount)) {
      return true;
    }

    toast.warning(t("about.license.unlimitedTransactionsBlocked") || "Limite do plano Free atingido. Desbloqueie no plano anual ou vitalício.");
    return false;
  }

  function requireAccountTransactionCreation(accountTxCount?: number): boolean {
    if (canCreateAccountTransaction(accountTxCount)) {
      return true;
    }

    toast.warning(t("about.license.accountTransactionsBlocked") || "Limite do plano Free atingido. Desbloqueie no plano anual ou vitalício.");
    return false;
  }

  function requireCardTransactionCreation(cardTxCount?: number): boolean {
    if (canCreateCardTransaction(cardTxCount)) {
      return true;
    }

    toast.warning(t("about.license.cardTransactionsBlocked") || "Limite do plano Free atingido. Desbloqueie no plano anual ou vitalício.");
    return false;
  }

  return {
    requireFeature,
    requireAccountCreation,
    requireCreditCardCreation,
    requireCategoryCreation,
    requireGoalCreation,
    requireTransactionCreation,
    requireAccountTransactionCreation,
    requireCardTransactionCreation,
    isPro: isPro(),
  };
}

/**
 * Função utilitária para uso fora de componentes React (sem toast)
 */
export function requireFeatureSync(feature: FeatureKey): boolean {
  return isFeatureEnabled(feature);
}

