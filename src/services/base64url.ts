/**
 * Utilitários para conversão base64url (URL-safe base64)
 */

/**
 * Converte string base64url para Uint8Array
 * Aceita strings sem padding (padding é adicionado automaticamente se necessário)
 */
export function b64urlToBytes(s: string): Uint8Array {
  // Base64url usa - e _ em vez de + e /
  let base64 = s.replace(/-/g, "+").replace(/_/g, "/");
  
  // Adicionar padding se necessário
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += "==".slice(0, padLength);
  
  // Decodificar base64
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converte Uint8Array para string base64url
 */
export function bytesToB64url(bytes: Uint8Array): string {
  // Converter para base64 normal
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  // Converter para base64url (remover padding e substituir caracteres)
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Converte string base64 (normal) para Uint8Array
 */
export function b64ToBytes(b64: string): Uint8Array {
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

