/**
 * Validador de tokens de licença Ed25519
 * Formato: LOCIONE1.<payload_base64url>.<signature_base64url>
 * A assinatura é feita sobre os bytes do JSON do payload (não base64url, não "LOCIONE1...")
 * 
 * Usa Node.js crypto via preload (window.locioneCrypto) pois WebCrypto não suporta Ed25519 no Electron
 */

import { SITE_PUBLIC_KEY_ED25519 } from "../licensePublicKey";

export interface LicensePayload {
  product: string;
  plan: "annual" | "lifetime";
  issued_at: string; // ISO 8601 date string
  expires_at: string | null; // ISO 8601 date string ou null
  max_devices: number;
  license_id?: string; // Opcional para compatibilidade
  email?: string; // Opcional
  notes?: string; // Opcional
}

export type ValidationResult =
  | {
      ok: true;
      payload: LicensePayload;
    }
  | {
      ok: false;
      reason: string;
    };

/**
 * Valida e decodifica um token de licença
 * Formato: LOCIONE1.<payload_base64url>.<signature_base64url>
 * A assinatura é verificada sobre os bytes do JSON do payload (não base64url, não "LOCIONE1...")
 */
export async function validateLicenseToken(token: string): Promise<ValidationResult> {
  try {
    // Verificar se window.locioneCrypto está disponível (Electron)
    const canVerify = typeof window !== "undefined" && !!window.locioneCrypto?.verifyToken;
    
    if (!canVerify) {
      return {
        ok: false,
        reason: "Ambiente não suportado nesta versão (web). Abra o app Desktop (Electron) para ativar a licença.",
      };
    }

    // 1. Verificar formato básico
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      return { ok: false, reason: "Formato de token inválido. Esperado: LOCIONE1.<payload>.<signature>" };
    }

    const [prefix] = parts;

    // 2. Verificar prefixo
    if (prefix !== "LOCIONE1") {
      return { ok: false, reason: "Prefixo inválido. Esperado: LOCIONE1" };
    }

    // 3. Verificar assinatura usando Node.js crypto via preload
    const verifyResult = window.locioneCrypto!.verifyToken(token, SITE_PUBLIC_KEY_ED25519);

    if (!verifyResult.ok) {
      return {
        ok: false,
        reason: verifyResult.error || "Assinatura inválida. Token pode ter sido alterado ou é de origem desconhecida.",
      };
    }

    // 4. Parse payload JSON
    let payload: any;
    try {
      if (!verifyResult.payloadJson) {
        return { ok: false, reason: "Payload inválido" };
      }
      payload = JSON.parse(verifyResult.payloadJson);
    } catch (error) {
      return { ok: false, reason: "Payload inválido ou corrompido" };
    }

    // 5. Validar estrutura do payload
    if (!payload.product || typeof payload.product !== "string") {
      return { ok: false, reason: "Payload inválido: product ausente ou inválido" };
    }

    if (payload.product !== "locione-desk") {
      return { ok: false, reason: "Produto incompatível. Esperado 'locione-desk'" };
    }

    // Normalizar plan (aceitar ANNUAL/LIFETIME em maiúsculas)
    const planNormalized = typeof payload.plan === "string" 
      ? payload.plan.toLowerCase() 
      : payload.plan;
    
    if (planNormalized !== "annual" && planNormalized !== "lifetime") {
      return { ok: false, reason: "Payload inválido: plan deve ser 'annual' ou 'lifetime'" };
    }

    if (!payload.issued_at || typeof payload.issued_at !== "string") {
      return { ok: false, reason: "Payload inválido: issued_at ausente ou inválido" };
    }

    if (typeof payload.max_devices !== "number" || payload.max_devices < 1) {
      return { ok: false, reason: "Payload inválido: max_devices deve ser >= 1" };
    }

    // 6. Validar expiração
    const now = new Date();
    if (payload.expires_at !== null && payload.expires_at !== undefined) {
      if (typeof payload.expires_at !== "string") {
        return { ok: false, reason: "Payload inválido: expires_at deve ser string ou null" };
      }
      const expiresAt = new Date(payload.expires_at);
      if (Number.isNaN(expiresAt.getTime())) {
        return { ok: false, reason: "Payload inválido: expires_at data inválida" };
      }
      if (expiresAt <= now) {
        return { ok: false, reason: "Licença expirada" };
      }
    }

    // 7. Normalizar plan no payload retornado
    const normalizedPayload: LicensePayload = {
      ...payload,
      plan: planNormalized as "annual" | "lifetime",
    };

    return { ok: true, payload: normalizedPayload };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[LicenseValidator] Erro ao validar token:", errorMessage);
    return { ok: false, reason: `Erro ao validar token: ${errorMessage}` };
  }
}
