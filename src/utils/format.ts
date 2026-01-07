import { format as formatDate, parseISO, Locale } from "date-fns";
import { ptBR, it, enUS } from "date-fns/locale";
import type { Settings } from "../domain/settings";
import { logger } from "./logger";
import { settingsRepository } from "../infra/repositories/settingsRepository";
import { IS_DEV } from "./isDev";

const dateLocales: Record<string, Locale> = {
  "pt-BR": ptBR,
  "it-IT": it,
  "en-US": enUS,
};

type SupportedLocale = "pt-BR" | "it-IT" | "en-US";
type SupportedCurrency = "BRL" | "EUR" | "USD";

const LOCALE_FALLBACK: SupportedLocale = "pt-BR";
const CURRENCY_FALLBACK: SupportedCurrency = "BRL";

/**
 * Normaliza locale de forma segura (à prova de bomba).
 * Aceita qualquer input e retorna sempre um SupportedLocale válido.
 */
function safeCanonicalLocale(input: unknown): SupportedLocale {
  const raw = String(input ?? "").trim();
  if (!raw) return LOCALE_FALLBACK;

  // pega só o primeiro "token" plausível
  const first = raw.split(/[|/,\s]+/).filter(Boolean)[0] ?? "";
  const normalized = first.replace("_", "-");

  // whitelisting forte
  const lowered = normalized.toLowerCase();
  const mapped: SupportedLocale =
    lowered === "pt" || lowered === "pt-br" ? "pt-BR" :
    lowered === "it" || lowered === "it-it" ? "it-IT" :
    lowered === "en" || lowered === "en-us" ? "en-US" :
    (normalized as SupportedLocale);

  // valida com Intl.NumberFormat (teste prático)
  try {
    // Testar se o locale funciona com Intl.NumberFormat
    new Intl.NumberFormat(mapped);
    // Se chegou aqui, o locale é válido
    if (mapped === "pt-BR" || mapped === "it-IT" || mapped === "en-US") return mapped;
    return LOCALE_FALLBACK;
  } catch {
    return LOCALE_FALLBACK;
  }
}

/**
 * Normaliza currency de forma segura.
 */
function safeCurrency(input: unknown): SupportedCurrency {
  const cur = String(input ?? "").trim().toUpperCase();
  if (cur === "BRL" || cur === "EUR" || cur === "USD") return cur;
  return CURRENCY_FALLBACK;
}

/**
 * Formata um valor em centavos como moeda.
 * À prova de bomba: sempre retorna um valor válido, mesmo com inputs ruins.
 */
export function formatCurrency(
  amountCents: number,
  opts?: { locale?: unknown; currency?: unknown; decimals?: number | "auto" }
): string {
  const locale = safeCanonicalLocale(opts?.locale);
  const currency = safeCurrency(opts?.currency);

  const value = (Number.isFinite(Number(amountCents)) ? Number(amountCents) : 0) / 100;

  const decimals =
    opts?.decimals === "auto"
      ? undefined
      : typeof opts?.decimals === "number"
        ? opts.decimals
        : 2;

  // Debug apenas em desenvolvimento
  if (IS_DEV) {
    logger.debugTag("formatCurrency", "input locale=", opts?.locale, "=>", locale, "| currency=", opts?.currency, "=>", currency);
  }

  // CRÍTICO: tudo dentro do try (inclusive construir formatter)
  try {
    const nf = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return nf.format(value);
  } catch (err) {
    logger.warnTag("formatCurrency", "fallback due to error:", err);
    const nf = new Intl.NumberFormat(LOCALE_FALLBACK, {
      style: "currency",
      currency: CURRENCY_FALLBACK,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return nf.format(value);
  }
}

/**
 * Formata um valor em centavos como moeda, usando settings.
 * IMPORTANTE: O parâmetro `currency` sempre tem prioridade sobre `settings.currencyPrimary`.
 * Isso permite formatar moedas secundárias corretamente.
 */
export function formatMoney(
  cents: number,
  currency: string = "BRL",
  settingsOrLocale?: Settings | SupportedLocale
): string {
  const value = cents / 100;
  
  if (typeof settingsOrLocale === "string") {
    return formatCurrency(value * 100, { locale: settingsOrLocale, currency });
  } else if (settingsOrLocale) {
    // CRÍTICO: usar o currency passado como parâmetro, não o currencyPrimary do settings
    // Isso permite formatar moedas secundárias corretamente
    const curr = safeCurrency(currency);
    const decimalsMode = settingsOrLocale.preferences.decimalsMode || "auto";
    const decimals = decimalsMode === "auto" ? undefined : decimalsMode === "0" ? 0 : 2;
    return formatCurrency(value * 100, {
      locale: safeCanonicalLocale(settingsOrLocale.preferences.locale),
      currency: curr, // Usar currency passado, não currencyPrimary do settings
      decimals,
    });
  }
  
  return formatCurrency(value * 100, { currency });
}

/**
 * Converte formato de data do usuário (DD/MM/YYYY) para formato date-fns (dd/MM/yyyy)
 * date-fns usa tokens minúsculos: dd (dia), MM (mês), yyyy (ano)
 */
function normalizeDateFormat(formatStr: string): string {
  // Converter tokens maiúsculos para minúsculos (date-fns requer minúsculas)
  return formatStr
    .replace(/DD/g, "dd")  // Dia: DD -> dd
    .replace(/YYYY/g, "yyyy") // Ano: YYYY -> yyyy
    .replace(/MM/g, "MM"); // Mês: MM permanece (já está correto)
}

/**
 * Formata uma data string.
 * Aceita formatos do usuário (DD/MM/YYYY) e converte para date-fns (dd/MM/yyyy)
 */
export function formatDateString(
  dateString: string,
  formatStr: string = "dd/MM/yyyy",
  settingsOrLocale?: Settings | SupportedLocale
): string {
  try {
    const date = parseISO(dateString);
    let locale: SupportedLocale = "pt-BR";
    
    if (typeof settingsOrLocale === "string") {
      locale = safeCanonicalLocale(settingsOrLocale);
    } else if (settingsOrLocale) {
      locale = safeCanonicalLocale(settingsOrLocale.preferences.locale);
    }
    
    // Normalizar formato para date-fns (converter DD/YYYY para dd/yyyy)
    const normalizedFormat = normalizeDateFormat(formatStr);
    
    const dateLocale = dateLocales[locale] || ptBR;
    return formatDate(date, normalizedFormat, { locale: dateLocale });
  } catch (error) {
    if (IS_DEV) {
      logger.warnTag("formatDateString", "Erro ao formatar data:", dateString, error);
    }
    return dateString;
  }
}

// Exportar funções de normalização para uso em outros lugares
export { safeCanonicalLocale as normalizeLocale, safeCurrency as normalizeCurrency };

// Helper para obter locale atual do settings (para usar quando não passado)
export function getCurrentLocale(): SupportedLocale {
  try {
    // Fallback: ler do settingsRepository
    const settings = settingsRepository.getSettings();
    return safeCanonicalLocale(settings.preferences.locale);
  } catch {
    return "pt-BR";
  }
}

// Funções de conveniência que usam locale atual do settings
export function formatCurrencyAuto(value: number, currency: string = "BRL"): string {
  try {
    const settings = settingsRepository.getSettings();
    const curr = safeCurrency(settings.preferences.currencyPrimary || currency);
    const decimalsMode = settings.preferences.decimalsMode || "auto";
    const decimals = decimalsMode === "auto" ? undefined : decimalsMode === "0" ? 0 : 2;
    return formatCurrency(value * 100, {
      locale: safeCanonicalLocale(settings.preferences.locale),
      currency: curr,
      decimals,
    });
  } catch {
    return formatCurrency(value * 100, { currency });
  }
}

export function formatMoneyAuto(cents: number, currency: string = "BRL"): string {
  const value = cents / 100;
  return formatCurrencyAuto(value, currency);
}

export function formatDateAuto(dateString: string, formatStr: string = "dd/MM/yyyy"): string {
  try {
    const settings = settingsRepository.getSettings();
    return formatDateString(dateString, formatStr, settings);
  } catch {
    return formatDateString(dateString, formatStr, "pt-BR");
  }
}

/**
 * Formata valor com moeda secundária (se habilitada).
 * Retorna objeto com primary (sempre) e secondary (opcional).
 * 
 * @param amountCents - Valor em centavos na moeda principal
 * @param primaryCurrencyCode - Código da moeda principal (ex: "BRL")
 * @param settings - Settings completo ou objeto com campos de moeda secundária
 * @returns Objeto com { primary: string, secondary?: string }
 * 
 * Regras:
 * - Se secondaryCurrencyEnabled === false => sem secondary
 * - Se secondaryCurrencyCode vazio ou igual à moeda principal => sem secondary
 * - Se manualFxRate inválido (<=0 ou NaN) => sem secondary (silencioso, não loga erro)
 * - Conversão: secondaryAmount = primaryAmount / manualFxRate
 *   Exemplo: 1000 centavos BRL (10.00 BRL) / 4.90 = 2.04 USD (204 centavos USD)
 *   Taxa manual = quanto 1 unidade da moeda secundária vale na moeda principal
 */
export function formatMoneyWithSecondary(
  amountCents: number,
  primaryCurrencyCode: string,
  settings?: Settings | {
    preferences?: {
      currencySecondaryEnabled?: boolean;
      currencySecondary?: string;
      manualFxRate?: number;
      locale?: string;
      decimalsMode?: "auto" | "0" | "2";
    };
  }
): { primary: string; secondary?: string } {
  // Usar settings como Settings completo se for, senão usar undefined para formatMoney
  const settingsForFormat: Settings | SupportedLocale | undefined = 
    settings && "preferences" in settings && settings.preferences && typeof settings.preferences === "object" && "currencyPrimary" in (settings.preferences as any)
      ? (settings as Settings)
      : undefined;
  
  const primary = formatMoney(amountCents, primaryCurrencyCode, settingsForFormat);
  
  // Verificar se deve mostrar moeda secundária
  if (!settings) {
    return { primary };
  }
  
  const prefs = settings.preferences || {};
  const enabled = prefs.currencySecondaryEnabled === true;
  const secondaryCode = prefs.currencySecondary;
  const fxRate = prefs.manualFxRate;
  
  // Validações para não mostrar secondary
  if (!enabled) {
    return { primary };
  }
  
  if (!secondaryCode || String(secondaryCode).trim() === "" || secondaryCode === primaryCurrencyCode) {
    return { primary };
  }
  
  if (!fxRate || fxRate <= 0 || !Number.isFinite(fxRate)) {
    // Taxa inválida: não mostrar secondary, mas não logar erro (silencioso)
    return { primary };
  }
  
  // Conversão correta: secondaryAmount = primaryAmount / manualFxRate
  // Exemplo: 1000 centavos BRL (10.00 BRL) / 4.90 = 2.04 USD (204 centavos USD)
  const primaryAmount = amountCents / 100; // Converter centavos para unidades
  const secondaryAmount = primaryAmount / fxRate; // Dividir pela taxa (1 USD = fxRate BRL)
  const secondaryAmountCents = Math.round(secondaryAmount * 100); // Converter de volta para centavos
  const secondary = formatMoney(secondaryAmountCents, String(secondaryCode), settingsForFormat);
  
  return { primary, secondary };
}
