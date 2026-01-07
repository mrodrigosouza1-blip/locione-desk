/**
 * Detecção de conectividade de internet
 * Rápida, com timeout, para não travar o app
 */

const PING_ENDPOINT = "https://api.locione.com/api/ping";
const CHECK_TIMEOUT_MS = 1500;

/**
 * Verifica se há conexão com internet
 * Primeiro checa navigator.onLine (heurística rápida)
 * Depois confirma com fetch rápido em endpoint de ping
 */
export async function hasInternet(): Promise<boolean> {
  // Heurística rápida: se navigator.onLine é false, provavelmente não há internet
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    const response = await fetch(PING_ENDPOINT, {
      method: "GET",
      signal: controller.signal,
      cache: "no-cache",
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Timeout, sem internet, ou outro erro
    return false;
  }
}

