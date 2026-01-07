/**
 * Validador de tokens de licença Ed25519
 */

import { getPublicKey, b64urlToUint8, utf8, verifyEd25519 } from "./licenseCrypto";

export interface LicensePayload {
  licenseId: string;
  plan: "annual" | "lifetime";
  iat: number; // issued at (timestamp)
  exp?: number; // expiration (timestamp, opcional)
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
 */
export async function validateLicenseToken(token: string): Promise<ValidationResult> {
  try {
    // 1. Verificar formato básico
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      return { ok: false, reason: "Formato de token inválido. Esperado: LOCIONE1.<payload>.<signature>" };
    }

    const [prefix, payloadB64url, sigB64url] = parts;

    // 2. Verificar prefixo
    if (prefix !== "LOCIONE1") {
      return { ok: false, reason: "Prefixo inválido. Esperado: LOCIONE1" };
    }

    // 3. Decodificar payload
    let payload: LicensePayload;
    try {
      const payloadBytes = b64urlToUint8(payloadB64url);
      const payloadJson = new TextDecoder().decode(payloadBytes);
      payload = JSON.parse(payloadJson);
    } catch (error) {
      return { ok: false, reason: "Payload inválido ou corrompido" };
    }

    // 4. Validar estrutura do payload
    if (!payload.licenseId || typeof payload.licenseId !== "string") {
      return { ok: false, reason: "Payload inválido: licenseId ausente ou inválido" };
    }

    if (payload.plan !== "annual" && payload.plan !== "lifetime") {
      return { ok: false, reason: "Payload inválido: plan deve ser 'annual' ou 'lifetime'" };
    }

    if (typeof payload.iat !== "number" || payload.iat <= 0) {
      return { ok: false, reason: "Payload inválido: iat ausente ou inválido" };
    }

    // 5. Validar expiração conforme o plano
    const now = Math.floor(Date.now() / 1000); // timestamp em segundos

    if (payload.plan === "annual") {
      if (!payload.exp || typeof payload.exp !== "number") {
        return { ok: false, reason: "Plano anual requer campo 'exp' (expiração)" };
      }
      if (payload.exp <= now) {
        return { ok: false, reason: "Licença anual expirada" };
      }
    } else if (payload.plan === "lifetime") {
      // Lifetime não deve ter exp
      if (payload.exp !== undefined) {
        return { ok: false, reason: "Plano vitalício não deve ter campo 'exp'" };
      }
    }

    // 6. Verificar assinatura
    // A assinatura é feita sobre: "LOCIONE1." + payload_base64url (UTF-8)
    const messageToVerify = `${prefix}.${payloadB64url}`;
    const messageBytes = utf8(messageToVerify);
    const signatureBytes = b64urlToUint8(sigB64url);

    const publicKey = await getPublicKey();
    const isValid = await verifyEd25519(publicKey, messageBytes, signatureBytes);

    if (!isValid) {
      return { ok: false, reason: "Assinatura inválida. Token pode ter sido alterado ou é de origem desconhecida." };
    }

    return { ok: true, payload };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `Erro ao validar token: ${errorMessage}` };
  }
}

