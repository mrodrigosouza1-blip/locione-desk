/**
 * Configuração de links externos do site LociOne
 */

export const LOCIONE_SITE_URL = import.meta.env.VITE_LOCIONE_SITE_URL || "";

/**
 * Verifica se há uma URL válida configurada
 */
export function hasSiteUrl(): boolean {
  return Boolean(LOCIONE_SITE_URL && LOCIONE_SITE_URL.startsWith("http"));
}

