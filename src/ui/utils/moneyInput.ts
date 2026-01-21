/**
 * Utilitários para inputs monetários que iniciam vazios.
 * Permite que o usuário digite sem problemas de "0300" ao invés de "300".
 */

/**
 * Parseia uma string de input monetário para centavos.
 * Se a string estiver vazia, retorna 0.
 * 
 * @param inputValue - String do input (ex: "300", "10.50", "")
 * @returns Valor em centavos (ex: 30000, 1050, 0)
 */
export function parseMoneyInput(inputValue: string): number {
  if (!inputValue || inputValue.trim() === "") {
    return 0;
  }
  
  // Remove caracteres não numéricos exceto ponto e vírgula
  const cleaned = inputValue.replace(/[^\d.,]/g, "");
  
  // Substitui vírgula por ponto para parseFloat
  const normalized = cleaned.replace(/,/g, ".");
  
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }
  
  // Converter para centavos
  return Math.round(parsed * 100);
}

export function getDecimalSeparator(locale: string): string {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1.1);
    return parts.find((part) => part.type === "decimal")?.value || ".";
  } catch {
    return ".";
  }
}

export function formatMoneyInputLocalized(cents: number, locale: string): string {
  if (cents === 0) {
    return "";
  }
  const base = (cents / 100).toFixed(2);
  const separator = getDecimalSeparator(locale);
  return separator === "." ? base : base.replace(".", separator);
}

export function getMoneyPlaceholder(currencyCode: string, locale: string): string {
  try {
    const resolvedLocale = getLocaleForCurrency(currencyCode, locale);
    const currencyFormatter = new Intl.NumberFormat(resolvedLocale, { style: "currency", currency: currencyCode });
    const { minimumFractionDigits, maximumFractionDigits } = currencyFormatter.resolvedOptions();
    const numberFormatter = new Intl.NumberFormat(resolvedLocale, { minimumFractionDigits, maximumFractionDigits });
    return `Ex: ${numberFormatter.format(0)}`;
  } catch {
    return "Ex: 0.00";
  }
}

function getLocaleForCurrency(currencyCode: string, fallbackLocale: string): string {
  const normalized = (currencyCode || "").toUpperCase();
  switch (normalized) {
    case "BRL":
      return "pt-BR";
    case "EUR":
      return "it-IT";
    case "USD":
      return "en-US";
    case "GBP":
      return "en-GB";
    default:
      return fallbackLocale;
  }
}

/**
 * Formata centavos para string de exibição no input.
 * Se for 0, retorna string vazia (para permitir placeholder).
 * 
 * @param cents - Valor em centavos
 * @returns String formatada (ex: "300.00", "") ou string vazia se 0
 */
export function formatMoneyInput(cents: number): string {
  if (cents === 0) {
    return "";
  }
  return (cents / 100).toFixed(2);
}

/**
 * Valida e limpa input enquanto o usuário digita.
 * Permite apenas dígitos, ponto e vírgula.
 * 
 * @param inputValue - Valor atual do input
 * @returns String limpa e válida
 */
export function cleanMoneyInput(inputValue: string): string {
  // Remove tudo exceto dígitos, ponto e vírgula
  let cleaned = inputValue.replace(/[^\d.,]/g, "");
  
  // Garante que há no máximo um separador decimal
  const parts = cleaned.split(/[.,]/);
  if (parts.length > 2) {
    // Se houver múltiplos separadores, manter apenas o primeiro
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  
  return cleaned;
}

