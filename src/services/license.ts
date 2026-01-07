/**
 * Serviço de licenças Ed25519 offline usando @noble/ed25519
 */

import * as ed25519 from "@noble/ed25519";
import { b64urlToBytes, b64ToBytes, bytesToB64url } from "./base64url";
import { canonicalize } from "./canonicalize";
import { ensureEd25519 } from "./ed25519Setup";
import { DEFAULT_PUBLIC_KEY_ED25519_SPKI_DER_BASE64 } from "./licensePublicKey";

export type LicensePlan = "FREE" | "ANNUAL" | "LIFETIME";

export interface LicensePayload {
  license_id: string;
  product: string;
  plan: LicensePlan;
  customer_email?: string | null;
  issued_at: string;
  expires_at: string | null;
  device_limit: number;
  features?: {
    premium?: boolean;
  };
}

export interface ParsedToken {
  payload: LicensePayload;
  signatureBytes: Uint8Array;
  payloadB64url: string;
  signatureB64url: string;
}

export interface LicenseStatus {
  isValid: boolean;
  isPremium: boolean;
  isLifetime: boolean;
  isAnnual: boolean;
  isFree: boolean;
  expiresAt?: Date | null;
}

// Chave pública obtida do ponto único de verdade, com override por env (apenas para DEV)
const getDefaultPublicKeyBase64 = (): string => {
  const envKey = (import.meta as any).env?.VITE_PUBLIC_KEY_ED25519;
  return (envKey && String(envKey).trim()) || DEFAULT_PUBLIC_KEY_ED25519_SPKI_DER_BASE64;
};

/**
 * Detecta se uma string provavelmente é base64url (vs base64 normal)
 * Base64url usa '-' e '_' em vez de '+' e '/', e geralmente não tem padding '='
 */
function isProbablyBase64Url(s: string): boolean {
  // Base64url contém '-' ou '_' e não contém '+' ou '/'
  return (s.includes("-") || s.includes("_")) && !s.includes("+") && !s.includes("/");
}

/**
 * Extrai a chave pública Ed25519 de um formato SPKI DER base64
 * O formato SPKI DER tem um header que precisa ser removido
 */
function extractEd25519PublicKeyFromSpki(spkiDerBytes: Uint8Array): Uint8Array {
  if (!spkiDerBytes || spkiDerBytes.length < 44) {
    throw new Error("SPKI DER inválido (curto demais)");
  }
  const pk = spkiDerBytes.slice(-32);
  if (pk.length !== 32) {
    throw new Error("Chave pública inválida (não tem 32 bytes)");
  }
  return pk;
}

/**
 * Parse do token LOCIONE1
 * Extrai payload e assinatura do token
 */
export function parseLocioneToken(token: string): ParsedToken {
  // Verificar prefixo
  if (!token.startsWith("LOCIONE1.")) {
    throw new Error("Token deve começar com 'LOCIONE1.'");
  }

  // Split por "."
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token deve ter formato: LOCIONE1.<payload>.<signature>");
  }

  const [, payloadB64url, signatureB64url] = parts;

  // Decodificar payload
  const payloadBytes = b64urlToBytes(payloadB64url);
  const payloadJson = new TextDecoder().decode(payloadBytes);
  const payload: LicensePayload = JSON.parse(payloadJson);

  // Decodificar assinatura
  const signatureBytes = b64urlToBytes(signatureB64url);

  return {
    payload,
    signatureBytes,
    payloadB64url,
    signatureB64url,
  };
}

/**
 * Parse do formato JSON de licença
 * Aceita JSON com campos payload e signature
 * signature pode ser base64 ou base64url
 */
export function parseJsonLicense(token: string): { payload: LicensePayload; signatureBytes: Uint8Array } {
  let jsonData: { payload: unknown; signature: unknown };
  
  try {
    jsonData = JSON.parse(token);
  } catch (error) {
    throw new Error("Token JSON inválido");
  }

  // Validar shape {payload, signature}
  if (!jsonData || typeof jsonData !== "object") {
    throw new Error("Token JSON deve ser um objeto");
  }

  if (!jsonData.payload || typeof jsonData.payload !== "object") {
    throw new Error("Token JSON deve conter campo 'payload'");
  }

  if (!jsonData.signature || typeof jsonData.signature !== "string") {
    throw new Error("Token JSON deve conter campo 'signature' como string");
  }

  const payload = jsonData.payload as LicensePayload;
  const signatureStr = jsonData.signature as string;

  // Detectar se signature é base64url ou base64 normal e converter para bytes
  let signatureBytes: Uint8Array;
  if (isProbablyBase64Url(signatureStr)) {
    signatureBytes = b64urlToBytes(signatureStr);
  } else {
    signatureBytes = b64ToBytes(signatureStr);
  }

  return {
    payload,
    signatureBytes,
  };
}

/**
 * Verifica assinatura Ed25519 do token
 * Suporta dois formatos:
 * A) Compacto: LOCIONE1.<payload_b64url>.<sig_b64url>
 * B) JSON: {"payload":{...},"signature":"..."} onde signature pode ser base64 ou base64url
 */
export async function verifyLocioneToken(
  token: string,
  publicKeyBase64: string = getDefaultPublicKeyBase64()
): Promise<{ ok: boolean; payload?: LicensePayload; reason?: string }> {
  try {
    // Garantir que SHA-512 está configurado antes de qualquer operação
    ensureEd25519();

    let payload: LicensePayload;
    let signatureBytes: Uint8Array;

    // Detectar formato do token
    if (token.startsWith("LOCIONE1.")) {
      // Formato compacto LOCIONE1
      const parsed = parseLocioneToken(token);
      payload = parsed.payload;
      signatureBytes = parsed.signatureBytes;
    } else {
      // Tentar formato JSON
      try {
        const parsed = parseJsonLicense(token);
        payload = parsed.payload;
        signatureBytes = parsed.signatureBytes;
      } catch (jsonError) {
        return {
          ok: false,
          reason: "Formato de licença inválido. Cole o token LOCIONE1 ou o JSON {payload, signature}.",
        };
      }
    }

    // Canonicalizar payload
    const canonical = canonicalize(payload);
    const messageBytes = new TextEncoder().encode(canonical);

    // Extrair chave pública do formato SPKI DER
    const spkiDerBytes = b64ToBytes(publicKeyBase64);
    const publicKeyBytes = extractEd25519PublicKeyFromSpki(spkiDerBytes);

    // Verificar assinatura usando @noble/ed25519
    const isValid = await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);

    if (!isValid) {
      // Incluir fingerprint da chave pública para facilitar debug
      const publicKeyFingerprint = bytesToB64url(publicKeyBytes.slice(0, 6));
      return {
        ok: false,
        reason: `Assinatura inválida. Token pode ter sido alterado ou é de origem desconhecida. (publicKeyFingerprint: ${publicKeyFingerprint})`,
      };
    }

    // Validações adicionais
    if (payload.product !== "finance-desktop") {
      return {
        ok: false,
        reason: `Produto inválido. Esperado 'finance-desktop', recebido '${payload.product}'`,
      };
    }

    // Validar plano e expiração
    const now = new Date();
    let isValidStatus = true;
    let reason: string | undefined;

    if (payload.plan === "LIFETIME") {
      // LIFETIME sempre válido (ignorar expires_at)
      isValidStatus = true;
    } else if (payload.plan === "ANNUAL") {
      // ANNUAL requer expires_at e deve ser > now
      if (!payload.expires_at) {
        isValidStatus = false;
        reason = "Plano anual requer campo 'expires_at'";
      } else {
        const expiresAt = new Date(payload.expires_at);
        if (Number.isNaN(expiresAt.getTime())) {
          isValidStatus = false;
          reason = "Campo 'expires_at' inválido (data inválida)";
        } else if (expiresAt <= now) {
          isValidStatus = false;
          reason = "Licença anual expirada";
        }
      }
    } else if (payload.plan === "FREE") {
      // FREE válido mas sem premium
      isValidStatus = true;
    } else {
      isValidStatus = false;
      reason = `Plano inválido: ${payload.plan}`;
    }

    if (!isValidStatus) {
      return { ok: false, reason };
    }

    return { ok: true, payload };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      reason: `Erro ao verificar token: ${errorMessage}`,
    };
  }
}

/**
 * Obtém status da licença a partir do payload
 */
export function getLicenseStatus(payload: LicensePayload): LicenseStatus {
  const now = new Date();
  const expiresAt = payload.expires_at ? new Date(payload.expires_at) : null;

  const isLifetime = payload.plan === "LIFETIME";
  const isAnnual = payload.plan === "ANNUAL";
  const isFree = payload.plan === "FREE";

  let isValid = false;
  let isPremium = false;

  if (isLifetime) {
    isValid = true;
    isPremium = true;
  } else if (isAnnual) {
    isValid = expiresAt ? expiresAt > now : false;
    isPremium = isValid;
  } else if (isFree) {
    isValid = true;
    isPremium = false;
  }

  // Verificar também features.premium se existir
  if (payload.features?.premium === true) {
    isPremium = isValid; // Só é premium se também for válido
  }

  return {
    isValid,
    isPremium,
    isLifetime,
    isAnnual,
    isFree,
    expiresAt,
  };
}

