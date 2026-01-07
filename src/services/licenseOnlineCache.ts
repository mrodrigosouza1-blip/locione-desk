/**
 * Cache local para status de revogação online
 * Persiste via settingsRepository
 */

import { settingsRepository } from "../infra/repositories/settingsRepository";

const CACHE_KEYS = {
  LAST_CHECK_AT: "license_revocation_last_check_at",
  LAST_STATUS: "license_revocation_last_status",
  REVOKED_AT: "license_revocation_revoked_at",
  REASON: "license_revocation_reason",
  TOKEN_HASH: "license_revocation_token_hash",
  ONLINE_MODE_ENABLED: "license_online_mode_enabled",
} as const;

export type RevocationStatus = "unknown" | "active" | "revoked";

export interface RevocationCache {
  last_check_at: string | null;
  last_status: RevocationStatus;
  revoked_at: string | null;
  reason: string | null;
  token_hash: string | null;
  online_mode_enabled: boolean;
}

const CACHE_TTL_HOURS = 24;

/**
 * Obtém se o modo online está habilitado
 * Default: false (offline por padrão)
 */
export function getOnlineModeEnabled(): boolean {
  try {
    const settings = settingsRepository.getSettings();
    const enabled = (settings.diagnostics as any)?.[CACHE_KEYS.ONLINE_MODE_ENABLED];
    return enabled === true; // Default false (offline por padrão)
  } catch {
    return false; // Default false (offline por padrão)
  }
}

/**
 * Define se o modo online está habilitado
 */
export async function setOnlineModeEnabled(enabled: boolean): Promise<void> {
  const settings = settingsRepository.getSettings();
  const diagnostics = {
    ...settings.diagnostics,
    [CACHE_KEYS.ONLINE_MODE_ENABLED]: enabled,
  };

  await settingsRepository.updateSettings({
    ...settings,
    diagnostics,
  });
}

/**
 * Carrega cache de revogação
 */
export function loadRevocationCache(): RevocationCache {
  try {
    const settings = settingsRepository.getSettings();
    const diagnostics = settings.diagnostics || {};

    return {
      last_check_at: (diagnostics as any)[CACHE_KEYS.LAST_CHECK_AT] || null,
      last_status: ((diagnostics as any)[CACHE_KEYS.LAST_STATUS] || "unknown") as RevocationStatus,
      revoked_at: (diagnostics as any)[CACHE_KEYS.REVOKED_AT] || null,
      reason: (diagnostics as any)[CACHE_KEYS.REASON] || null,
      token_hash: (diagnostics as any)[CACHE_KEYS.TOKEN_HASH] || null,
      online_mode_enabled: getOnlineModeEnabled(),
    };
  } catch {
    return {
      last_check_at: null,
      last_status: "unknown",
      revoked_at: null,
      reason: null,
      token_hash: null,
      online_mode_enabled: false,
    };
  }
}

/**
 * Salva cache de revogação
 */
export async function saveRevocationCache(data: Partial<RevocationCache>): Promise<void> {
  const settings = settingsRepository.getSettings();
  const diagnostics = { ...settings.diagnostics };

  if (data.last_check_at !== undefined) {
    (diagnostics as any)[CACHE_KEYS.LAST_CHECK_AT] = data.last_check_at;
  }
  if (data.last_status !== undefined) {
    (diagnostics as any)[CACHE_KEYS.LAST_STATUS] = data.last_status;
  }
  if (data.revoked_at !== undefined) {
    (diagnostics as any)[CACHE_KEYS.REVOKED_AT] = data.revoked_at;
  }
  if (data.reason !== undefined) {
    (diagnostics as any)[CACHE_KEYS.REASON] = data.reason;
  }
  if (data.token_hash !== undefined) {
    (diagnostics as any)[CACHE_KEYS.TOKEN_HASH] = data.token_hash;
  }

  await settingsRepository.updateSettings({
    ...settings,
    diagnostics,
  });
}

/**
 * Verifica se deve checar revogação agora
 */
export function shouldCheckNow(tokenHash: string, force: boolean = false): boolean {
  if (force) {
    return true;
  }

  if (!getOnlineModeEnabled()) {
    return false;
  }

  const cache = loadRevocationCache();

  // Se token_hash mudou, licença mudou - precisa checar
  if (cache.token_hash && cache.token_hash !== tokenHash) {
    return true;
  }

  // Se nunca checou, precisa checar
  if (!cache.last_check_at) {
    return true;
  }

  // Se passou mais de 24h, precisa checar
  const lastCheck = new Date(cache.last_check_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

  return hoursDiff >= CACHE_TTL_HOURS;
}

