import { format, addMonths } from "date-fns";

/**
 * Calcula o ciclo de fatura para uma data de referência e dia de fechamento
 * @param referenceDate Data de referência (geralmente hoje)
 * @param closingDay Dia de fechamento do cartão (1-31)
 * @returns Objeto com início e fim do ciclo atual em formato YYYY-MM
 */
export function getBillingCycleForDate(referenceDate: Date, closingDay: number): {
  cycleStart: string; // YYYY-MM (mês que o ciclo começou)
  cycleEnd: string; // YYYY-MM (mês que o ciclo fecha)
  isBeforeClosing: boolean; // Se a data está antes do fechamento
} {
  const today = new Date(referenceDate);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Calcular data de fechamento do mês atual
  // Se closingDay > último dia do mês, usar o último dia do mês
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const actualClosingDay = Math.min(closingDay, lastDayOfMonth);
  const thisMonthClosing = new Date(currentYear, currentMonth, actualClosingDay);
  
  let cycleStart: string;
  let cycleEnd: string;
  let isBeforeClosing: boolean;
  
  // Se hoje está ANTES ou NO fechamento do mês atual:
  // - O ciclo atual começou no fechamento do mês anterior
  // - O ciclo atual fecha no fechamento do mês atual
  // O mês da fatura é o mês do fechamento (mês atual)
  
  // Se hoje está DEPOIS do fechamento do mês atual:
  // - O ciclo atual começou no fechamento do mês atual
  // - O ciclo atual fecha no fechamento do próximo mês
  // O mês da fatura é o mês do próximo fechamento (próximo mês)
  
  if (today <= thisMonthClosing) {
    // Estamos antes ou no fechamento do mês atual
    // O ciclo atual fecha neste mês
    isBeforeClosing = true;
    cycleEnd = format(thisMonthClosing, "yyyy-MM");
    // O ciclo começou no fechamento do mês anterior
    const previousMonthClosing = addMonths(thisMonthClosing, -1);
    cycleStart = format(previousMonthClosing, "yyyy-MM");
  } else {
    // Estamos depois do fechamento do mês atual
    // O ciclo atual começou no fechamento deste mês
    isBeforeClosing = false;
    cycleStart = format(thisMonthClosing, "yyyy-MM");
    // O ciclo fecha no fechamento do próximo mês
    const nextMonthClosing = addMonths(thisMonthClosing, 1);
    cycleEnd = format(nextMonthClosing, "yyyy-MM");
  }
  
  return { cycleStart, cycleEnd, isBeforeClosing };
}

/**
 * Calcula qual competência uma compra deve ter baseado na data da compra e fechamento
 * @param purchaseDate Data da compra
 * @param closingDay Dia de fechamento do cartão
 * @returns Competência (YYYY-MM) que a compra deve ter (mês do fechamento da fatura)
 */
export function getCompetenceForPurchase(purchaseDate: Date, closingDay: number): string {
  const purchaseYear = purchaseDate.getFullYear();
  const purchaseMonth = purchaseDate.getMonth();
  
  // Calcular data de fechamento do mês da compra
  const lastDayOfMonth = new Date(purchaseYear, purchaseMonth + 1, 0).getDate();
  const actualClosingDay = Math.min(closingDay, lastDayOfMonth);
  const thisMonthClosing = new Date(purchaseYear, purchaseMonth, actualClosingDay);
  
  // Se a compra foi feita ANTES ou NO fechamento do mês da compra:
  // - Entra na fatura que fecha neste mês (competência = mês da compra)
  // Se a compra foi feita DEPOIS do fechamento do mês da compra:
  // - Entra na fatura que fecha no próximo mês (competência = próximo mês)
  
  if (purchaseDate <= thisMonthClosing) {
    // Compra entra na fatura que fecha no mês da compra
    return format(purchaseDate, "yyyy-MM");
  } else {
    // Compra entra na fatura que fecha no próximo mês
    return format(addMonths(purchaseDate, 1), "yyyy-MM");
  }
}

