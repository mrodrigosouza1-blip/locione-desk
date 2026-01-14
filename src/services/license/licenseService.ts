/**
 * Serviço de gerenciamento de licenças com validação Ed25519 offline
 */

import { validateLicenseToken } from "./licenseValidator";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { logger } from "../../utils/logger";
import type { LicensePlan } from "../../domain/license";

export interface LicenseState {
  plan: LicensePlan;
  licenseId?: string;
  activatedAtISO: string;
  expiresAtISO: string | null;
}

export interface LicenseStateWithLabel extends LicenseState {
  isPremium: boolean;
  label?: string;
}

/**
 * Chave no settings para armazenar estado da licença
 */
const LICENSE_STATE_KEY = "license.state";

/**
 * Valida e ativa uma licença a partir de um token
 */
export async function validateAndActivateLicense(token: string): Promise<
  | { ok: true; state: LicenseState }
  | { ok: false; reason: string }
> {
  try {
    // Validar token
    const validation = await validateLicenseToken(token);
    
    if (!validation.ok) {
      return { ok: false, reason: validation.reason };
    }

    const { payload } = validation;

    // Criar estado da licença
    const now = new Date();
    const state: LicenseState = {
      plan: payload.plan,
      licenseId: payload.license_id,
      activatedAtISO: payload.issued_at || now.toISOString(),
      expiresAtISO: payload.expires_at || null,
    };

    // Salvar no settings
    const currentSettings = settingsRepository.getSettings();
    const updatedSettings = {
      ...currentSettings,
      [LICENSE_STATE_KEY]: state,
    };
    settingsRepository.updateSettings(updatedSettings as any);

    logger.infoTag("LicenseService", `Licença ${payload.plan} ativada: ${payload.license_id || "N/A"}`);

    return { ok: true, state };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.errorTag("LicenseService", "Erro ao ativar licença:", error);
    return { ok: false, reason: `Erro ao processar licença: ${errorMessage}` };
  }
}

/**
 * Obtém o estado atual da licença
 */
export function getLicenseState(): LicenseStateWithLabel {
  try {
    const settings = settingsRepository.getSettings();
    const state = (settings as any)[LICENSE_STATE_KEY] as LicenseState | undefined;

    if (!state) {
      // Estado padrão: FREE
      return {
        plan: "free",
        activatedAtISO: new Date().toISOString(),
        expiresAtISO: null,
        isPremium: false,
      };
    }

    // Verificar se é premium
    const isPremium = isPremiumActive(state);

    // Gerar label
    let label: string | undefined;
    if (state.plan === "lifetime") {
      label = "Vitalício";
    } else if (state.plan === "annual") {
      label = "Anual";
    }

    return {
      ...state,
      isPremium,
      label,
    };
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao obter estado da licença:", error);
    return {
      plan: "free",
      activatedAtISO: new Date().toISOString(),
      expiresAtISO: null,
      isPremium: false,
    };
  }
}

/**
 * Desativa a licença (volta para FREE)
 */
export function deactivateLicense(): void {
  try {
    const currentSettings = settingsRepository.getSettings();
    const updatedSettings = {
      ...currentSettings,
      [LICENSE_STATE_KEY]: {
        plan: "free",
        activatedAtISO: new Date().toISOString(),
        expiresAtISO: null,
      } as LicenseState,
    };
    settingsRepository.updateSettings(updatedSettings as any);
    logger.infoTag("LicenseService", "Licença desativada (volta para FREE)");
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao desativar licença:", error);
  }
}

/**
 * Ativa plano FREE (para teste/reset)
 * @deprecated Esta função só deve ser usada em desenvolvimento
 * Em produção, use clearLicenseToken() diretamente
 */
export function activateFreePlan(): void {
  try {
    const currentSettings = settingsRepository.getSettings();
    const updatedSettings = {
      ...currentSettings,
      [LICENSE_STATE_KEY]: {
        plan: "free",
        activatedAtISO: new Date().toISOString(),
        expiresAtISO: null,
      } as LicenseState,
    };
    settingsRepository.updateSettings(updatedSettings as any);
    logger.infoTag("LicenseService", "Plano FREE ativado (teste)");
  } catch (error) {
    logger.errorTag("LicenseService", "Erro ao ativar plano FREE:", error);
  }
}

/**
 * Verifica se o premium está ativo
 * Retorna true se:
 * - plan="lifetime" OU
 * - plan="annual" e expiresAtISO no futuro
 */
export function isPremiumActive(state?: LicenseState): boolean {
  const licenseState = state || getLicenseState();

  if (licenseState.plan === "lifetime") {
    return true;
  }

  if (licenseState.plan === "annual") {
    if (!licenseState.expiresAtISO) {
      return false;
    }
    const now = new Date();
    const expiresAt = new Date(licenseState.expiresAtISO);
    return now < expiresAt;
  }

  return false;
}

// ===== COMPATIBILIDADE COM CÓDIGO ANTIGO =====
// Mantém funções antigas para não quebrar código existente

import type { License } from "../../domain/license";

/**
 * @deprecated Use getLicenseState() em vez disso
 */
export function getLicense(): License {
  const state = getLicenseState();
  return {
    plan: state.plan,
    activatedAt: state.activatedAtISO,
    expiresAt: state.expiresAtISO || undefined,
    licenseKey: state.licenseId,
  };
}

/**
 * @deprecated Use validateAndActivateLicense() em vez disso
 */
export function setLicense(license: License): void {
  const state: LicenseState = {
    plan: license.plan,
    licenseId: license.licenseKey,
    activatedAtISO: license.activatedAt,
    expiresAtISO: license.expiresAt || null,
  };

  const currentSettings = settingsRepository.getSettings();
  const updatedSettings = {
    ...currentSettings,
    [LICENSE_STATE_KEY]: state,
  };
  settingsRepository.updateSettings(updatedSettings as any);
}

/**
 * @deprecated Use isPremiumActive() em vez disso
 */
export function isPro(): boolean {
  return isPremiumActive();
}

/**
 * @deprecated Use isPremiumActive() em vez disso
 */
export function checkLicenseValid(): boolean {
  return isPremiumActive();
}

/**
 * @deprecated Use getLicenseState() em vez disso
 */
export function getActivePlan(): LicensePlan {
  return getLicenseState().plan;
}

// Manter outras funções de compatibilidade
export function isFeatureEnabled(_feature: string): boolean {
  return isPremiumActive();
}

export function isAnnualValid(): boolean {
  const state = getLicenseState();
  return state.plan === "annual" && isPremiumActive(state);
}

export function canCreateAccount(currentCount?: number): boolean {
  if (isPremiumActive()) {
    return true;
  }
  // FREE: máximo 1 conta
  return (currentCount ?? 0) < 1;
}

export function canCreateCreditCard(currentCount?: number): boolean {
  if (isPremiumActive()) {
    return true;
  }
  // FREE: máximo 1 cartão
  return (currentCount ?? 0) < 1;
}

export function canCreateCategory(currentCount?: number): boolean {
  if (isPremiumActive()) {
    return true;
  }
  // FREE: máximo 5 categorias
  return (currentCount ?? 0) < 5;
}

export function canCreateGoal(currentCount?: number): boolean {
  if (isPremiumActive()) {
    return true;
  }
  // FREE: máximo 1 meta
  return (currentCount ?? 0) < 1;
}

export function canCreateTransaction(totalCount?: number): boolean {
  if (isPremiumActive()) {
    return true;
  }
  // FREE: máximo 50 transações
  return (totalCount ?? 0) < 50;
}

export function canCreateAccountTransaction(accountTxCount?: number): boolean {
  if (isPremiumActive()) {
    return true;
  }
  // FREE: máximo 25 transações de conta
  return (accountTxCount ?? 0) < 25;
}

export function canCreateCardTransaction(cardTxCount?: number): boolean {
  if (isPremiumActive()) {
    return true;
  }
  // FREE: máximo 25 transações de cartão
  return (cardTxCount ?? 0) < 25;
}

