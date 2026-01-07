/**
 * Centraliza verificação do modo online (opcional)
 * Default: OFF (offline por padrão)
 */

import { getOnlineModeEnabled as getOnlineModeEnabledFromCache } from "./licenseOnlineCache";

/**
 * Verifica se o modo online está habilitado
 * Retorna false se não existir configuração (default OFF)
 * Fail-safe: nunca lança erro, sempre retorna boolean
 */
export function isOnlineModeEnabled(): boolean {
  try {
    return getOnlineModeEnabledFromCache();
  } catch {
    // Fail-safe: se houver qualquer erro, retornar false (offline)
    return false;
  }
}

