/**
 * Gate de verificação online de revogação
 * Integra detecção de internet, cache e request mínimo
 */

import { hasInternet } from "./network";
import { tokenHash } from "./tokenFingerprint";
import { checkRevocationOnline } from "./licenseRevocationOnline";
import {
  loadRevocationCache,
  saveRevocationCache,
  shouldCheckNow,
  type RevocationStatus,
} from "./licenseOnlineCache";
import { isOnlineModeEnabled } from "./licenseOnlineMode";
import type { LicensePayload } from "./license";
import { logger } from "../utils/logger";

// Singleton para status de revogação em memória
let revocationState: RevocationStatus = "unknown";
let revocationInfo: {
  revoked_at?: string;
  reason?: string;
  last_check_at?: string;
  online_mode_enabled?: boolean;
} = {};

/**
 * Obtém estado atual de revogação (em memória)
 */
export function getRevocationState(): RevocationStatus {
  return revocationState;
}

/**
 * Obtém informações de revogação
 */
export function getRevocationInfo() {
  return revocationInfo;
}

/**
 * Atualiza estado de revogação em memória
 */
function updateRevocationState(status: RevocationStatus, info: Partial<typeof revocationInfo>) {
  revocationState = status;
  revocationInfo = {
    ...revocationInfo,
    ...info,
  };
}

/**
 * Carrega estado de revogação do cache para memória
 */
export function loadRevocationStateFromCache(): void {
  const cache = loadRevocationCache();
  updateRevocationState(cache.last_status, {
    revoked_at: cache.revoked_at || undefined,
    reason: cache.reason || undefined,
    last_check_at: cache.last_check_at || undefined,
    online_mode_enabled: cache.online_mode_enabled,
  });
}

/**
 * Atualiza revogação se necessário
 * Retorna estado final (unknown, active, revoked)
 */
export async function refreshRevocationIfNeeded(
  token: string,
  payload: LicensePayload,
  force: boolean = false
): Promise<RevocationStatus> {
  // FREE não precisa checar
  if (payload.plan === "FREE") {
    updateRevocationState("active", {});
    return "active";
  }

  // Se não tem license_id, não pode checar
  if (!payload.license_id) {
    return "unknown";
  }

  // Se modo online desabilitado, retornar cache ou unknown
  if (!isOnlineModeEnabled()) {
    const cache = loadRevocationCache();
    updateRevocationState(cache.last_status, {
      last_check_at: cache.last_check_at || undefined,
      online_mode_enabled: false,
    });
    return cache.last_status;
  }

  // Calcular hash do token
  let tokenHashValue: string;
  try {
    tokenHashValue = await tokenHash(token);
  } catch (error) {
    logger.warnTag("LicenseOnlineGate", "Erro ao calcular hash do token:", error);
    return revocationState;
  }

  // Verificar se deve checar agora
  if (!shouldCheckNow(tokenHashValue, force)) {
    // Usar cache existente
    const cache = loadRevocationCache();
    updateRevocationState(cache.last_status, {
      revoked_at: cache.revoked_at || undefined,
      reason: cache.reason || undefined,
      last_check_at: cache.last_check_at || undefined,
      online_mode_enabled: true,
    });
    return cache.last_status;
  }

  // Verificar se há internet
  const online = await hasInternet();
  if (!online) {
    // Sem internet, usar cache existente ou unknown
    const cache = loadRevocationCache();
    const status = cache.last_status !== "unknown" ? cache.last_status : "unknown";
    updateRevocationState(status, {
      revoked_at: cache.revoked_at || undefined,
      reason: cache.reason || undefined,
      last_check_at: cache.last_check_at || undefined,
      online_mode_enabled: true,
    });
    return status;
  }

  // Fazer request online
  try {
    const result = await checkRevocationOnline({
      licenseId: payload.license_id,
      product: payload.product,
      tokenHash: tokenHashValue,
    });

    const now = new Date().toISOString();

    if (result.ok) {
      if (result.revoked) {
        // Revogada
        await saveRevocationCache({
          last_check_at: now,
          last_status: "revoked",
          revoked_at: result.revoked_at || now,
          reason: result.reason || null,
          token_hash: tokenHashValue,
        });

        updateRevocationState("revoked", {
          revoked_at: result.revoked_at || now,
          reason: result.reason,
          last_check_at: now,
          online_mode_enabled: true,
        });

        logger.infoTag("LicenseOnlineGate", `Licença revogada: ${payload.license_id.substring(0, 8)}...`);
        return "revoked";
      } else {
        // Ativa
        await saveRevocationCache({
          last_check_at: now,
          last_status: "active",
          revoked_at: null,
          reason: null,
          token_hash: tokenHashValue,
        });

        updateRevocationState("active", {
          last_check_at: now,
          online_mode_enabled: true,
        });

        return "active";
      }
    } else {
      // Erro no request, manter cache existente
      logger.warnTag("LicenseOnlineGate", `Erro ao verificar revogação: ${result.error}`);
      const cache = loadRevocationCache();
      const status = cache.last_status !== "unknown" ? cache.last_status : "unknown";
      updateRevocationState(status, {
        revoked_at: cache.revoked_at || undefined,
        reason: cache.reason || undefined,
        last_check_at: cache.last_check_at || undefined,
        online_mode_enabled: true,
      });
      return status;
    }
  } catch (error) {
    // Erro não deve derrubar o app
    logger.errorTag("LicenseOnlineGate", "Erro ao verificar revogação:", error);
    const cache = loadRevocationCache();
    const status = cache.last_status !== "unknown" ? cache.last_status : "unknown";
    updateRevocationState(status, {
      last_check_at: cache.last_check_at || undefined,
      online_mode_enabled: true,
    });
    return status;
  }
}

