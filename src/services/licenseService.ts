/**
 * Serviço de gerenciamento de licenças local
 * @deprecated Use src/services/licenseGate.ts e src/services/license.ts em vez disso
 * Este arquivo mantém compatibilidade com código antigo
 */

// Re-exportar do novo sistema
import { isPremium, getPlan } from "./licenseGate";
import { getStoredLicense } from "./licenseStorage";
import type { LicensePlan } from "./license";

// Compatibilidade: isPro -> isPremium
export function isPro(): boolean {
  return isPremium();
}

// Compatibilidade: getActivePlan
export function getActivePlan(): LicensePlan {
  return getPlan();
}

// Compatibilidade: getLicense (formato antigo)
import type { License } from "../domain/license";
export function getLicense(): License {
  const stored = getStoredLicense();
  if (!stored.payload) {
    return {
      plan: "free",
      activatedAt: new Date().toISOString(),
      expiresAt: null,
    };
  }
  return {
    plan: stored.payload.plan.toLowerCase() as "free" | "annual" | "lifetime",
    activatedAt: stored.payload.issued_at,
    expiresAt: stored.payload.expires_at || undefined,
    licenseKey: stored.payload.license_id,
  };
}

// Compatibilidade: setLicense (formato antigo)
import { setLicenseToken, clearLicenseToken } from "./licenseStorage";
export function setLicense(license: License): void {
  if (license.plan === "free") {
    clearLicenseToken();
    return;
  }
  // Para compatibilidade, criar payload mínimo
  const payload = {
    license_id: license.licenseKey || "legacy",
    product: "finance-desktop",
    plan: license.plan.toUpperCase() as "ANNUAL" | "LIFETIME",
    issued_at: license.activatedAt,
    expires_at: license.expiresAt || null,
    device_limit: 1,
  };
  setLicenseToken("LEGACY", payload);
}

// Compatibilidade: checkLicenseValid
export function checkLicenseValid(): boolean {
  return isPremium();
}

// Compatibilidade: isFeatureEnabled
export function isFeatureEnabled(_feature: string): boolean {
  return isPremium();
}

// Compatibilidade: isAnnualValid
export function isAnnualValid(): boolean {
  const plan = getPlan();
  if (plan !== "ANNUAL") {
    return false;
  }
  const stored = getStoredLicense();
  if (!stored.status) {
    return false;
  }
  return stored.status.isValid && stored.status.isAnnual;
}

// Compatibilidade: canCreateAccount, etc.
import { getDatabase } from "../infra/database";
import { logger } from "../utils/logger";

export function canCreateAccount(currentCount?: number): boolean {
  if (isPremium()) {
    return true;
  }
  try {
    const count = currentCount !== undefined ? currentCount : (() => {
      const db = getDatabase();
      return db.accounts?.length || 0;
    })();
    return count < 1;
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao verificar contas:", error);
    return true;
  }
}

export function canCreateCreditCard(currentCount?: number): boolean {
  if (isPremium()) {
    return true;
  }
  try {
    const count = currentCount !== undefined ? currentCount : (() => {
      const db = getDatabase();
      return db.creditCards?.length || 0;
    })();
    return count < 1;
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao verificar cartões:", error);
    return true;
  }
}

export function canCreateCategory(currentCount?: number): boolean {
  if (isPremium()) {
    return true;
  }
  try {
    const count = currentCount !== undefined ? currentCount : (() => {
      const db = getDatabase();
      return db.categories?.length || 0;
    })();
    return count < 5;
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao verificar categorias:", error);
    return true;
  }
}

export function canCreateGoal(currentCount?: number): boolean {
  if (isPremium()) {
    return true;
  }
  try {
    const count = currentCount !== undefined ? currentCount : (() => {
      const db = getDatabase();
      return db.goals?.length || 0;
    })();
    return count < 1;
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao verificar metas:", error);
    return true;
  }
}

export function canCreateTransaction(totalCount?: number): boolean {
  if (isPremium()) {
    return true;
  }
  try {
    const count = totalCount !== undefined ? totalCount : (() => {
      const db = getDatabase();
      return db.transactions?.length || 0;
    })();
    return count < 50;
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao verificar transações:", error);
    return true;
  }
}

export function canCreateAccountTransaction(accountTxCount?: number): boolean {
  if (isPremium()) {
    return true;
  }
  try {
    const count = accountTxCount !== undefined ? accountTxCount : (() => {
      const db = getDatabase();
      const transactions = db.transactions || [];
      return transactions.filter((t: any) => t.account_id && !t.credit_card_id).length;
    })();
    return count < 25;
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao verificar transações de conta:", error);
    return true;
  }
}

export function canCreateCardTransaction(cardTxCount?: number): boolean {
  if (isPremium()) {
    return true;
  }
  try {
    const count = cardTxCount !== undefined ? cardTxCount : (() => {
      const db = getDatabase();
      const transactions = db.transactions || [];
      return transactions.filter((t: any) => t.credit_card_id).length;
    })();
    return count < 25;
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao verificar transações de cartão:", error);
    return true;
  }
}
