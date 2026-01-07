/**
 * Geração de fingerprint/hash de tokens para verificação online
 * Usa WebCrypto API (disponível no renderer)
 */

/**
 * Converte string para Uint8Array (UTF-8)
 */
function stringToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/**
 * Converte ArrayBuffer para hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Calcula SHA-256 hash de uma string e retorna em hex
 * Usa WebCrypto API (disponível no renderer)
 */
export async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("WebCrypto API não disponível");
  }

  const bytes = stringToBytes(input);
  // Converter para ArrayBuffer garantido (não ArrayBufferLike/SharedArrayBuffer)
  const arrayBuffer = bytes.buffer instanceof ArrayBuffer
    ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    : new Uint8Array(bytes).buffer;
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return arrayBufferToHex(hashBuffer);
}

/**
 * Calcula hash do token para verificação online
 * Retorna hex string do SHA-256 do token
 */
export async function tokenHash(token: string): Promise<string> {
  return sha256Hex(token);
}

