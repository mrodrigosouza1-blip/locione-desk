/**
 * Serviço de CRL (Certificate Revocation List) para revogação offline-friendly de licenças
 * Baixa lista de revogação assinada do servidor quando há internet
 */

import * as ed25519 from "@noble/ed25519";
import { b64urlToBytes, b64ToBytes } from "./base64url";
import { canonicalize } from "./canonicalize";
import { ensureEd25519 } from "./ed25519Setup";
import { DEFAULT_PUBLIC_KEY_ED25519_SPKI_DER_BASE64 } from "./licensePublicKey";

export interface RevokedLicense {
  license_id: string;
  revoked_at: string;
  reason?: string;
}

export interface CrlPayload {
  version: number;
  updated_at: string;
  revoked: RevokedLicense[];
}

export interface ParsedCrlToken {
  payload: CrlPayload;
  signatureBytes: Uint8Array;
}

// URL do endpoint CRL (configurável via settings ou constante)
const CRL_ENDPOINT = "https://api.locione.com/licenses/crl";
const FETCH_TIMEOUT_MS = 2500;

/**
 * Extrai a chave pública Ed25519 de um formato SPKI DER base64
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
 * Parse do token CRL1
 * Extrai payload e assinatura do token
 */
export function parseCrlToken(token: string): ParsedCrlToken {
  // Verificar prefixo
  if (!token.startsWith("CRL1.")) {
    throw new Error("Token CRL deve começar com 'CRL1.'");
  }

  // Split por "."
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token CRL deve ter formato: CRL1.<payload>.<signature>");
  }

  const [, payloadB64url, signatureB64url] = parts;

  // Decodificar payload
  const payloadBytes = b64urlToBytes(payloadB64url);
  const payloadJson = new TextDecoder().decode(payloadBytes);
  const payload: CrlPayload = JSON.parse(payloadJson);

  // Decodificar assinatura
  const signatureBytes = b64urlToBytes(signatureB64url);

  return {
    payload,
    signatureBytes,
  };
}

/**
 * Verifica assinatura Ed25519 do token CRL
 */
export async function verifyCrlToken(
  token: string,
  publicKeyBase64: string = DEFAULT_PUBLIC_KEY_ED25519_SPKI_DER_BASE64
): Promise<{ ok: boolean; payload?: CrlPayload; reason?: string }> {
  try {
    // Garantir que SHA-512 está configurado
    ensureEd25519();

    // Parse do token
    const { payload, signatureBytes } = parseCrlToken(token);

    // Canonicalizar payload
    const canonical = canonicalize(payload);
    const messageBytes = new TextEncoder().encode(canonical);

    // Extrair chave pública do formato SPKI DER
    const spkiDerBytes = b64ToBytes(publicKeyBase64);
    const publicKeyBytes = extractEd25519PublicKeyFromSpki(spkiDerBytes);

    // Verificar assinatura usando @noble/ed25519
    const isValid = await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);

    if (!isValid) {
      return {
        ok: false,
        reason: "Assinatura CRL inválida. Token pode ter sido alterado ou é de origem desconhecida.",
      };
    }

    // Validações adicionais
    if (payload.version !== 1) {
      return {
        ok: false,
        reason: `Versão CRL inválida. Esperado 1, recebido ${payload.version}`,
      };
    }

    if (!payload.updated_at) {
      return {
        ok: false,
        reason: "CRL inválida: campo 'updated_at' ausente",
      };
    }

    if (!Array.isArray(payload.revoked)) {
      return {
        ok: false,
        reason: "CRL inválida: campo 'revoked' deve ser um array",
      };
    }

    return { ok: true, payload };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      reason: `Erro ao verificar CRL: ${errorMessage}`,
    };
  }
}

/**
 * Busca token CRL do endpoint
 * Retorna null se falhar (timeout, sem internet, etc)
 */
export async function fetchCrlToken(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(CRL_ENDPOINT, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && typeof data.token === "string") {
      return data.token;
    }

    return null;
  } catch (error) {
    // Timeout, sem internet, ou outro erro - retornar null silenciosamente
    return null;
  }
}

/**
 * Atualiza cache CRL se houver internet
 * Fire-and-forget: não bloqueia UI
 */
export async function updateCrlCacheIfOnline(): Promise<boolean> {
  // Verificar se modo online está habilitado antes de fazer qualquer chamada de rede
  const { isOnlineModeEnabled } = await import("./licenseOnlineMode");
  if (!isOnlineModeEnabled()) {
    return false; // Modo online desabilitado, não fazer fetch
  }

  try {
    const token = await fetchCrlToken();
    if (!token) {
      return false;
    }

    const result = await verifyCrlToken(token);
    if (!result.ok || !result.payload) {
      return false;
    }

    // Salvar CRL verificada no storage
    const { saveCrl } = await import("./crlStorage");
    await saveCrl(result.payload);

    return true;
  } catch (error) {
    // Erro silencioso - não bloquear app
    return false;
  }
}

