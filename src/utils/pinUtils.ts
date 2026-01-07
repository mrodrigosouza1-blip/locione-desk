// Utilitários para hash de PIN (nunca armazenar PIN em texto plano)

const PIN_SALT = "leciondesk-pin-salt-v1"; // Salt fixo do app

export async function hashPin(pin: string): Promise<string> {
  // Usar Web Crypto API para gerar hash SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + PIN_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const computedHash = await hashPin(pin);
  return computedHash === hash;
}

