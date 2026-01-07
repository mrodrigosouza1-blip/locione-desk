import { getDatabase } from "../infra/database";
import type { CreditCard } from "./types";
import { getBillingCycleForDate } from "./billingCycle";

export interface InvoiceItem {
  transaction_id: number;
  description: string;
  amount_cents: number;
  date: string;
  installment_number?: number;
  installment_total?: number;
  parent_transaction_id?: number;
  total_purchase_amount_cents?: number; // Valor total da compra parcelada (informativo)
}

export interface Invoice {
  cycleStart: string; // YYYY-MM
  cycleEnd: string; // YYYY-MM
  invoice_total_cents: number; // Valor em aberto (charges - payments)
  charges_total_cents: number; // Total de compras no ciclo
  payments_total_cents: number; // Total de pagamentos no ciclo
  items: InvoiceItem[];
}

/**
 * FUNÇÃO CENTRAL: Calcula a janela do ciclo de fatura do cartão
 */
export function getCardCycleWindow(
  card: CreditCard,
  referenceDate: Date = new Date()
): { cycleStart: string; cycleEnd: string } {
  const { cycleStart, cycleEnd } = getBillingCycleForDate(referenceDate, card.closing_day);
  return { cycleStart, cycleEnd };
}

/**
 * FUNÇÃO CENTRAL: Calcula a fatura atual do cartão com itens agrupados
 */
export function getCurrentInvoice(
  cardId: number,
  referenceDate: Date = new Date()
): Invoice {
  const db = getDatabase();
  const card = db.creditCards.find((c) => c.id === cardId);
  if (!card) {
    return {
      cycleStart: "",
      cycleEnd: "",
      invoice_total_cents: 0,
      charges_total_cents: 0,
      payments_total_cents: 0,
      items: [],
    };
  }

  const { cycleStart, cycleEnd } = getCardCycleWindow(card, referenceDate);

  // REGRA: A fatura atual contém transações cuja competence_month é o mês do fechamento (cycleEnd)
  // O cycleEnd representa o mês em que o ciclo fecha, que é o mês da fatura
  const invoiceMonth = cycleEnd;

  // Buscar todas as transações do ciclo atual
  // As transações que pertencem à fatura atual têm competence_month = invoiceMonth (mês do fechamento)
  const cycleTransactions = db.transactions.filter(
    (t) =>
      t.credit_card_id === cardId &&
      t.type === "credit_card_charge" &&
      t.competence_month === invoiceMonth
  );

  // Agrupar itens e calcular total da compra para parcelas
  const items: InvoiceItem[] = [];
  const processedGroups = new Set<number>();

  for (const transaction of cycleTransactions) {
    // Se é parcela de uma compra parcelada
    if (transaction.installment_total && transaction.installment_total > 1) {
      // Identificar grupo: primeira parcela não tem parent_transaction_id, demais têm
      // Se tem parent_transaction_id, usar ele como grupo
      // Se não tem, é a primeira parcela, usar o próprio id como grupo
      const groupId = transaction.parent_transaction_id || transaction.id;
      
      if (!processedGroups.has(groupId)) {
        processedGroups.add(groupId);
        
        // Buscar todas as parcelas do grupo
        // Grupo = todas que têm parent_transaction_id = groupId OU (id = groupId e não tem parent_transaction_id)
        const allInstallments = db.transactions.filter(
          (t) =>
            t.credit_card_id === cardId &&
            t.type === "credit_card_charge" &&
            ((t.parent_transaction_id === groupId) || (t.id === groupId && !t.parent_transaction_id))
        );
        
        const totalPurchaseAmount = Math.abs(
          allInstallments.reduce((sum, t) => sum + Math.abs(t.amount_cents), 0)
        );

        // Adicionar apenas a parcela do ciclo atual
        // A parcela pertence à fatura se sua competence_month é o mês do fechamento (invoiceMonth)
        const currentInstallment = allInstallments.find(
          (t) => t.competence_month === invoiceMonth
        );

        if (currentInstallment) {
          items.push({
            transaction_id: currentInstallment.id,
            description: currentInstallment.description || "",
            amount_cents: Math.abs(currentInstallment.amount_cents),
            date: currentInstallment.date,
            installment_number: currentInstallment.installment_number ?? undefined,
            installment_total: currentInstallment.installment_total ?? undefined,
            parent_transaction_id: currentInstallment.parent_transaction_id ?? undefined,
            total_purchase_amount_cents: totalPurchaseAmount,
          });
        }
      }
    } else {
      // Compra à vista (não parcelada)
      items.push({
        transaction_id: transaction.id,
        description: transaction.description || "",
        amount_cents: Math.abs(transaction.amount_cents),
        date: transaction.date,
      });
    }
  }

  // Calcular total de compras (charges) no ciclo
  const charges_total_cents = items.reduce((sum, item) => sum + item.amount_cents, 0);

  // Buscar pagamentos do cartão no ciclo atual
  // Pagamentos têm type = "card_payment" e credit_card_id = cardId
  const cyclePayments = db.transactions.filter(
    (t) =>
      t.credit_card_id === cardId &&
      t.type === "card_payment" &&
      t.competence_month === invoiceMonth
  );

  // Calcular total de pagamentos (soma valores absolutos, pois são salvos como negativos)
  const payments_total_cents = cyclePayments.reduce(
    (sum, payment) => sum + Math.abs(payment.amount_cents),
    0
  );

  // Valor em aberto = compras - pagamentos (mínimo 0)
  const invoice_total_cents = Math.max(charges_total_cents - payments_total_cents, 0);

  return {
    cycleStart,
    cycleEnd,
    invoice_total_cents,
    charges_total_cents,
    payments_total_cents,
    items,
  };
}

/**
 * Busca fatura de um ciclo específico
 */
export function getInvoiceForCycle(
  cardId: number,
  cycleMonth: string // YYYY-MM
): Invoice {
  const db = getDatabase();
  const card = db.creditCards.find((c) => c.id === cardId);
  if (!card) {
    return {
      cycleStart: cycleMonth,
      cycleEnd: cycleMonth,
      invoice_total_cents: 0,
      charges_total_cents: 0,
      payments_total_cents: 0,
      items: [],
    };
  }

  // Buscar transações do ciclo específico
  const cycleTransactions = db.transactions.filter(
    (t) =>
      t.credit_card_id === cardId &&
      t.type === "credit_card_charge" &&
      t.competence_month === cycleMonth
  );

  const items: InvoiceItem[] = [];
  const processedGroups = new Set<number>();

  for (const transaction of cycleTransactions) {
    if (transaction.installment_total && transaction.installment_total > 1) {
      const groupId = transaction.parent_transaction_id || transaction.id;
      
      if (!processedGroups.has(groupId)) {
        processedGroups.add(groupId);
        
        const allInstallments = db.transactions.filter(
          (t) =>
            t.credit_card_id === cardId &&
            t.type === "credit_card_charge" &&
            ((t.parent_transaction_id === groupId) || (t.id === groupId && !t.parent_transaction_id))
        );
        
        const totalPurchaseAmount = Math.abs(
          allInstallments.reduce((sum, t) => sum + Math.abs(t.amount_cents), 0)
        );

        const currentInstallment = allInstallments.find(
          (t) => t.competence_month === cycleMonth
        );

        if (currentInstallment) {
          items.push({
            transaction_id: currentInstallment.id,
            description: currentInstallment.description || "",
            amount_cents: Math.abs(currentInstallment.amount_cents),
            date: currentInstallment.date,
            installment_number: currentInstallment.installment_number ?? undefined,
            installment_total: currentInstallment.installment_total ?? undefined,
            parent_transaction_id: currentInstallment.parent_transaction_id ?? undefined,
            total_purchase_amount_cents: totalPurchaseAmount,
          });
        }
      }
    } else {
      items.push({
        transaction_id: transaction.id,
        description: transaction.description || "",
        amount_cents: Math.abs(transaction.amount_cents),
        date: transaction.date,
      });
    }
  }

  // Calcular total de compras (charges) no ciclo
  const charges_total_cents = items.reduce((sum, item) => sum + item.amount_cents, 0);

  // Buscar pagamentos do cartão no ciclo específico
  const cyclePayments = db.transactions.filter(
    (t) =>
      t.credit_card_id === cardId &&
      t.type === "card_payment" &&
      t.competence_month === cycleMonth
  );

  // Calcular total de pagamentos
  const payments_total_cents = cyclePayments.reduce(
    (sum, payment) => sum + Math.abs(payment.amount_cents),
    0
  );

  // Valor em aberto = compras - pagamentos (mínimo 0)
  const invoice_total_cents = Math.max(charges_total_cents - payments_total_cents, 0);

  return {
    cycleStart: cycleMonth,
    cycleEnd: cycleMonth,
    invoice_total_cents,
    charges_total_cents,
    payments_total_cents,
    items,
  };
}

