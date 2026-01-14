/**
 * Funções de criptografia para validação de licenças Ed25519 usando WebCrypto API
 * Compatível com renderer (não usa require/node:crypto)
 */

import { SITE_PUBLIC_KEY_ED25519 } from "../licensePublicKey";

/**
 * Converte string base64 para ArrayBuffer
 */
export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converte string base64url para Uint8Array
 */
export function b64urlToUint8(b64url: string): Uint8Array {
  // Base64url usa - e _ em vez de + e /
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  // Adicionar padding se necessário
  const padded = base64 + "==".slice((2 - base64.length * 3) & 3);
  const binaryString = atob(padded);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converte string UTF-8 para Uint8Array
 */
export function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/**
 * Importa chave pública Ed25519 no formato SPKI (DER base64)
 */
export async function importEd25519PublicKeySpkiBase64(spkiB64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(spkiB64);
  
  return await crypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "Ed25519",
    },
    false, // não exportável
    ["verify"] // apenas verificação
  );
}

/**
 * Verifica assinatura Ed25519
 */
export async function verifyEd25519(
  publicKey: CryptoKey,
  messageBytes: Uint8Array,
  signatureBytes: Uint8Array
): Promise<boolean> {
  try {
    // Converter para ArrayBuffer garantido (não ArrayBufferLike/SharedArrayBuffer)
    const messageBuffer = messageBytes.buffer instanceof ArrayBuffer
      ? messageBytes.buffer.slice(messageBytes.byteOffset, messageBytes.byteOffset + messageBytes.byteLength)
      : new Uint8Array(messageBytes).buffer;
    const signatureBuffer = signatureBytes.buffer instanceof ArrayBuffer
      ? signatureBytes.buffer.slice(signatureBytes.byteOffset, signatureBytes.byteOffset + signatureBytes.byteLength)
      : new Uint8Array(signatureBytes).buffer;
    return await crypto.subtle.verify(
      "Ed25519",
      publicKey,
      signatureBuffer,
      messageBuffer
    );
  } catch (error) {
    console.error("Erro ao verificar assinatura Ed25519:", error);
    return false;
  }
}

/**
 * Obtém a chave pública padrão (cache)
 */
let cachedPublicKey: CryptoKey | null = null;

export async function getPublicKey(): Promise<CryptoKey> {
  if (!cachedPublicKey) {
    // Chave pública com override por env (apenas para DEV)
    const envKey = (import.meta as any).env?.VITE_PUBLIC_KEY_ED25519;
    const publicKeyBase64 = (envKey && String(envKey).trim()) || SITE_PUBLIC_KEY_ED25519;
    cachedPublicKey = await importEd25519PublicKeySpkiBase64(publicKeyBase64);
  }
  return cachedPublicKey;
}

