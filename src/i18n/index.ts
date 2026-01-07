import { ptBR } from "./locales/pt-BR";
import { itIT } from "./locales/it-IT";
import { enUS } from "./locales/en-US";

export type SupportedLocale = "pt-BR" | "it-IT" | "en-US";

const ALL: Record<SupportedLocale, Record<string, string>> = {
  "pt-BR": ptBR,
  "it-IT": itIT,
  "en-US": enUS,
};

const DEFAULT_LOCALE: SupportedLocale = "pt-BR";

/**
 * Normaliza um locale string para um SupportedLocale válido.
 * Regras:
 * - Trim
 * - Primeiro token se tiver "/" ou "_"
 * - Substituir "_" por "-"
 * - Canonicalizar
 * - Fallback para pt-BR
 */
export function normalizeLocale(input?: string | null): SupportedLocale {
  if (!input) return DEFAULT_LOCALE;
  
  let normalized = input.trim();
  
  // Extrair primeiro token se tiver "/" ou "_"
  const slashIndex = normalized.indexOf("/");
  const underscoreIndex = normalized.indexOf("_");
  if (slashIndex > 0) {
    normalized = normalized.substring(0, slashIndex);
  } else if (underscoreIndex > 0) {
    normalized = normalized.substring(0, underscoreIndex);
  }
  
  // Substituir "_" por "-"
  normalized = normalized.replace(/_/g, "-");
  
  // Canonicalizar (uppercase country code se existir)
  const parts = normalized.split("-");
  if (parts.length === 2) {
    normalized = `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
  } else {
    normalized = normalized.toLowerCase();
  }
  
  // Verificar se é suportado
  if (normalized === "pt-BR" || normalized === "it-IT" || normalized === "en-US") {
    return normalized as SupportedLocale;
  }
  
  // Fallback para pt-BR
  return DEFAULT_LOCALE;
}

/**
 * Obtém as mensagens para um locale específico.
 */
export function getMessages(locale: SupportedLocale): Record<string, string> {
  return ALL[locale] || ALL[DEFAULT_LOCALE];
}

/**
 * Converte uma key crua em uma string "labelizada" (ex: "advancedPreferences" -> "Advanced Preferences").
 */
function labelizeKey(key: string): string {
  // Se a key já tem pontos, pegar a última parte
  const parts = key.split(".");
  const lastPart = parts[parts.length - 1];
  
  // Converter camelCase/PascalCase para "Title Case"
  // Ex: "advancedPreferences" -> "Advanced Preferences"
  const labelized = lastPart
    .replace(/([A-Z])/g, " $1") // Adicionar espaço antes de maiúsculas
    .replace(/^./, (str) => str.toUpperCase()) // Primeira letra maiúscula
    .trim();
  
  return labelized || key;
}

/**
 * Traduz uma chave, com fallback seguro.
 * 
 * Fallback order:
 * 1. Tentar no locale atual
 * 2. Tentar no locale padrão (pt-BR)
 * 3. Se não encontrar, "labelizar" a key (nunca mostrar key crua)
 */
export function translate(key: string, locale: SupportedLocale, vars?: Record<string, string | number>): string {
  const messages = getMessages(locale);
  let text = messages[key];
  
  // Se não encontrou no locale atual, tentar no padrão
  if (!text) {
    const defaultMessages = getMessages(DEFAULT_LOCALE);
    text = defaultMessages[key];
  }
  
  // Se ainda não encontrou, labelizar a key (nunca mostrar key crua)
  if (!text) {
    text = labelizeKey(key);
  }
  
  // Interpolação simples: "Olá {name}" -> "Olá João"
  if (vars) {
    Object.entries(vars).forEach(([varKey, varValue]) => {
      text = text.replace(new RegExp(`\\{${varKey}\\}`, "g"), String(varValue));
    });
  }
  
  return text;
}

