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
  const normalized = cleaned.replace(",", ".");
  
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }
  
  // Converter para centavos
  return Math.round(parsed * 100);
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

