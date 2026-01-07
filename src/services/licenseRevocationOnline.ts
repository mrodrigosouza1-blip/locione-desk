/**
 * Cliente de verificação online de revogação de licença
 * Request mínimo: apenas license_id + product + token_hash
 * Zero vazamento de dados do usuário
 */

import { settingsRepository } from "../infra/repositories/settingsRepository";

const DEFAULT_BASE_URL = "https://api.locione.com";
const REQUEST_TIMEOUT_MS = 2000;

export interface RevocationResponse {
  ok: true;
  revoked: boolean;
  revoked_at?: string;
  reason?: string;
  server_time?: string;
}

export interface RevocationError {
  ok: false;
  error: string;
}

export type RevocationCheckResult = RevocationResponse | RevocationError;

export interface RevocationCheckArgs {
  licenseId: string;
  product: string;
  tokenHash: string;
}

/**
 * Obtém URL base do servidor de licenças
 */
function getBaseUrl(): string {
  const settings = settingsRepository.getSettings();
  // Se houver configuração de license_server_url, usar ela
  const customUrl = (settings as any).license_server_url;
  return customUrl || DEFAULT_BASE_URL;
}

/**
 * Verifica revogação online da licença
 * Request mínimo: apenas license_id, product e token_hash
 */
export async function checkRevocationOnline(
  args: RevocationCheckArgs
): Promise<RevocationCheckResult> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/licenses/status`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        license_id: args.licenseId,
        product: args.product,
        token_hash: args.tokenHash,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Validar estrutura da resposta
    if (typeof data.revoked !== "boolean") {
      return {
        ok: false,
        error: "Resposta inválida do servidor",
      };
    }

    return {
      ok: true,
      revoked: data.revoked,
      revoked_at: data.revoked_at || undefined,
      reason: data.reason || undefined,
      server_time: data.server_time || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Não logar token completo - apenas prefixo e últimos chars se necessário
    if (errorMessage.includes("aborted")) {
      return {
        ok: false,
        error: "Timeout ao verificar revogação",
      };
    }

    return {
      ok: false,
      error: `Erro ao verificar revogação: ${errorMessage}`,
    };
  }
}

