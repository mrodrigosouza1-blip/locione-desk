/**
 * Utilitários para Safe Boot - recuperação de falhas de inicialização
 * Usa preSettings para funcionar antes do DB estar inicializado
 */

import { getPreSetting, setPreSetting, removePreSetting } from "../infra/preSettings";
import { logger } from "./logger";

const BOOT_FAIL_COUNT_KEY = "boot_fail_count";
const SAFE_MODE_KEY = "safe_mode";

/**
 * Incrementa o contador de falhas de boot
 */
export function incrementBootFailCount(): number {
  try {
    const currentValue = getPreSetting(BOOT_FAIL_COUNT_KEY);
    const currentCount = currentValue ? parseInt(currentValue, 10) : 0;
    const newCount = currentCount + 1;
    
    setPreSetting(BOOT_FAIL_COUNT_KEY, newCount.toString());
    
    // Log apenas se realmente houver falhas (não no primeiro incremento normal)
    if (newCount > 1) {
      logger.warnTag("bootSafety", `Boot fail count incremented to ${newCount}`);
    }
    
    // Se atingiu 3 falhas, ativar safe mode
    if (newCount >= 3) {
      activateSafeMode();
    }
    
    return newCount;
  } catch (error) {
    logger.errorTag("bootSafety", "Erro ao incrementar boot fail count:", error);
    return 0;
  }
}

/**
 * Reseta o contador de falhas de boot (chamado quando boot completa com sucesso)
 */
export function resetBootFailCount(): void {
  try {
    const currentValue = getPreSetting(BOOT_FAIL_COUNT_KEY);
    const currentCount = currentValue ? parseInt(currentValue, 10) : 0;
    
    if (currentCount > 0) {
      removePreSetting(BOOT_FAIL_COUNT_KEY);
      logger.infoTag("bootSafety", "Boot fail count reset to 0");
    }
  } catch (error) {
    logger.errorTag("bootSafety", "Erro ao resetar boot fail count:", error);
  }
}

/**
 * Ativa o modo seguro
 */
export function activateSafeMode(): void {
  try {
    setPreSetting(SAFE_MODE_KEY, "true");
    logger.warnTag("bootSafety", "Safe mode activated due to repeated boot failures");
  } catch (error) {
    logger.errorTag("bootSafety", "Erro ao ativar safe mode:", error);
  }
}

/**
 * Desativa o modo seguro
 */
export function deactivateSafeMode(): void {
  try {
    removePreSetting(SAFE_MODE_KEY);
    removePreSetting(BOOT_FAIL_COUNT_KEY);
    logger.infoTag("bootSafety", "Safe mode deactivated");
  } catch (error) {
    logger.errorTag("bootSafety", "Erro ao desativar safe mode:", error);
  }
}

/**
 * Verifica se o modo seguro está ativo
 */
export function isSafeModeActive(): boolean {
  try {
    // Ler de preSettings (funciona antes do DB)
    const safeModeValue = getPreSetting(SAFE_MODE_KEY);
    return safeModeValue === "true";
  } catch (error) {
    logger.errorTag("bootSafety", "Erro ao verificar safe mode:", error);
    return false;
  }
}

/**
 * Obtém o contador atual de falhas de boot
 */
export function getBootFailCount(): number {
  try {
    const value = getPreSetting(BOOT_FAIL_COUNT_KEY);
    if (value) {
      const count = parseInt(value, 10);
      if (!isNaN(count)) {
        return count;
      }
    }
    return 0;
  } catch (error) {
    logger.errorTag("bootSafety", "Erro ao obter boot fail count:", error);
    return 0;
  }
}
