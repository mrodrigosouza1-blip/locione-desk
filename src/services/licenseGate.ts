/**
 * Gate centralizado para verificação de licença premium
 * Usa cache do status verificado (não verifica assinatura a cada render)
 * Verifica também CRL (Certificate Revocation List) para revogação offline-friendly
 */

import { getStoredLicense } from "./licenseStorage";
import type { LicensePlan } from "./license";
import { loadCrl } from "./crlStorage";
import type { RevokedLicense } from "./crl";
import { getRevocationState } from "./licenseOnlineGate";
import { isOnlineModeEnabled } from "./licenseOnlineMode";

/**
 * Verifica se uma license_id está revogada na CRL
 */
export function isRevoked(licenseId: string): boolean {
  const crlData = loadCrl();
  if (!crlData || !crlData.payload) {
    return false; // Sem CRL, assumir não revogada
  }

  return crlData.payload.revoked.some((revoked) => revoked.license_id === licenseId);
}

/**
 * Obtém informações de revogação de uma license_id
 */
export function getRevocationInfo(licenseId: string): RevokedLicense | null {
  const crlData = loadCrl();
  if (!crlData || !crlData.payload) {
    return null;
  }

  return crlData.payload.revoked.find((revoked) => revoked.license_id === licenseId) || null;
}

/**
 * Verifica se o plano é premium efetivo (considera revogação online quando modo online está ON)
 * Retorna false se:
 * - plano FREE
 * - expirado
 * - revogado online (quando online mode enabled e estado revogado conhecido)
 * Retorna true só se:
 * - anual/vitalício válido e NÃO revogado
 * 
 * Se Online Mode OFF, ignora revogação online (não "punir" offline)
 * Se Online Mode ON mas "status unknown" (ainda não checou), mantém premium (fail-open)
 */
export function isPremiumEffective(): boolean {
  const stored = getStoredLicense();
  if (!stored.status) {
    return false;
  }

  // Se não é premium ou não é válido, retornar false
  if (!stored.status.isPremium || !stored.status.isValid) {
    return false;
  }

  // Se modo online está ON, verificar revogação online
  if (isOnlineModeEnabled()) {
    const onlineRevocationState = getRevocationState();
    if (onlineRevocationState === "revoked") {
      return false; // Revogada online, não é premium efetivo
    }
    // Se status é "unknown" (ainda não checou), manter premium (fail-open)
    // Não bloquear por falta de internet ou verificação pendente
  }

  // Verificar se está revogada na CRL (fallback offline)
  if (stored.payload?.license_id) {
    if (isRevoked(stored.payload.license_id)) {
      return false; // Revogada na CRL, não é premium
    }
  }

  return true;
}

/**
 * Verifica se o plano é premium (ANNUAL válido ou LIFETIME)
 * Também verifica se a licença está revogada (CRL e online)
 * @deprecated Use isPremiumEffective() para considerar revogação online corretamente
 */
export function isPremium(): boolean {
  return isPremiumEffective();
}

/**
 * Obtém o plano atual
 */
export function getPlan(): LicensePlan {
  const stored = getStoredLicense();
  if (!stored.payload) {
    return "FREE";
  }
  return stored.payload.plan;
}

/**
 * Verifica se deve mostrar badge premium
 */
export function shouldShowPremiumBadge(): boolean {
  const stored = getStoredLicense();
  if (!stored.status) {
    return false;
  }
  return stored.status.isPremium && stored.status.isValid;
}

/**
 * Obtém label do plano para exibição
 */
export function getPlanLabel(): string | null {
  const plan = getPlan();
  if (plan === "LIFETIME") {
    return "Vitalício";
  }
  if (plan === "ANNUAL") {
    return "Premium";
  }
  return null;
}

