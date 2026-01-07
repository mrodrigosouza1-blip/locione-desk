/**
 * Tipos e definições para o sistema de licença local
 */

export type LicensePlan = "free" | "annual" | "lifetime";

export type FeatureKey =
  | "EXPORT_PDF"
  | "BACKUP_RESTORE"
  | "MULTIPLE_ACCOUNTS"
  | "UNLIMITED_TRANSACTIONS"
  | "ADVANCED_REPORTS";

export interface License {
  plan: LicensePlan;
  activatedAt: string; // ISO string
  expiresAt?: string | null; // ISO string | null (apenas para ANUAL)
  licenseKey?: string; // Chave de licença (opcional por enquanto)
}

/**
 * Verifica se uma licença é válida
 */
export function isLicenseValid(license: License): boolean {
  if (license.plan === "free") {
    return true; // FREE sempre válido
  }

  if (license.plan === "lifetime") {
    return true; // VITALÍCIO sempre válido
  }

  if (license.plan === "annual") {
    if (!license.expiresAt) {
      return false; // ANUAL sem data de expiração é inválido
    }
    const now = new Date();
    const expiresAt = new Date(license.expiresAt);
    return now < expiresAt; // Válido se ainda não expirou
  }

  return false;
}

/**
 * Obtém o plano padrão (FREE)
 */
export function getDefaultLicense(): License {
  return {
    plan: "free",
    activatedAt: new Date().toISOString(),
    expiresAt: null,
  };
}

