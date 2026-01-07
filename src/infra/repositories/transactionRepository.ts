import { getDatabase, saveDatabaseAsync } from "../database";
import type { Transaction, CreateTransactionDto } from "../../domain/types";
import { format, parse, addMonths } from "date-fns";
import { creditCardRepository } from "./creditCardRepository";
import { getCompetenceForPurchase } from "../../domain/billingCycle";
import { getI18n } from "../../i18n/I18nProvider";
import { TRK } from "../../i18n/keys/transactionRepositoryKeys";
import { emitAppEvent } from "../../ui/state/appEvents";

export const transactionRepository = {
  async findAll(filters?: {
    accountId?: number;
    creditCardId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<Transaction[]> {
    const db = getDatabase();
    let transactions = [...db.transactions];

    if (filters?.accountId) {
      transactions = transactions.filter((t: Transaction) => t.account_id === filters.accountId);
    }
    if (filters?.creditCardId) {
      transactions = transactions.filter((t: Transaction) => t.credit_card_id === filters.creditCardId);
    }
    if (filters?.startDate) {
      transactions = transactions.filter((t: Transaction) => t.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      transactions = transactions.filter((t: Transaction) => t.date <= filters.endDate!);
    }
    if (filters?.type) {
      transactions = transactions.filter((t: Transaction) => t.type === filters.type);
    }

    return transactions.sort((a: Transaction, b: Transaction) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.created_at.localeCompare(a.created_at);
    });
  },

  async findById(id: number): Promise<Transaction | undefined> {
    const db = getDatabase();
    return db.transactions.find((t: Transaction) => t.id === id);
  },

  async create(data: CreateTransactionDto): Promise<Transaction> {
    const db = getDatabase();
    
    // REGRA: Parcelamento gera N lançamentos futuros
    if (data.installments && data.installments > 1 && data.credit_card_id) {
      return await this.createInstallments(data);
    }

    // REGRA: Transferências sempre em par, ligadas por transfer_id
    if (data.type === "transfer") {
      return await this.createTransfer(data);
    }

    const newId = db.transactions.length > 0 ? Math.max(...db.transactions.map((t) => t.id)) + 1 : 1;
    
    // REGRA: Entrada (receita) = positivo, Saída (despesa) = negativo
    // Garantir que o sinal está correto baseado no tipo
    let amountCents = data.amount_cents;
    if (data.type === "income" && amountCents < 0) {
      amountCents = Math.abs(amountCents);
    } else if ((data.type === "expense" || data.type === "credit_card_charge") && amountCents > 0) {
      amountCents = -Math.abs(amountCents);
    }
    
    const transaction: Transaction = {
      id: newId,
      ...data,
      amount_cents: amountCents,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.transactions.push(transaction);
    await saveDatabaseAsync();

    // REGRA: Compras reduzem limite disponível
    if (data.credit_card_id && data.type === "credit_card_charge") {
      await creditCardRepository.updateAvailableLimit(
        data.credit_card_id,
        -Math.abs(amountCents)
      );
    }

    // Emitir evento de mudança de dados
    emitAppEvent("data:changed");

    return transaction;
  },

  async createTransfer(data: CreateTransactionDto): Promise<Transaction> {
    // REGRA: Transferências sempre em par, ligadas por transfer_id
    // data deve conter: from_account_id, to_account_id, amount_cents
    const db = getDatabase();
    const transferId = db.transactions.length > 0 ? Math.max(...db.transactions.map((t: Transaction) => t.id || 0)) + 1 : 1;
    const amountCents = Math.abs(data.amount_cents);

    // Transação de saída (conta origem)
    const fromTransaction: Transaction = {
      id: transferId,
      type: "transfer",
      amount_cents: -amountCents,
      date: data.date,
      competence_month: data.competence_month,
      description: data.description || (() => {
        const { t } = getI18n();
        return t(TRK.transfer.toAccount, { accountId: data.account_id ?? "" });
      })(),
      account_id: (data as any).from_account_id,
      category_id: data.category_id || null,
      transfer_id: transferId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Transação de entrada (conta destino)
    const toTransaction: Transaction = {
      id: transferId + 1,
      type: "transfer",
      amount_cents: amountCents,
      date: data.date,
      competence_month: data.competence_month,
      description: data.description || (() => {
        const { t } = getI18n();
        return t(TRK.transfer.fromAccount, { accountId: (data as any).from_account_id });
      })(),
      account_id: data.account_id, // conta destino
      category_id: data.category_id || null,
      transfer_id: transferId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.transactions.push(fromTransaction);
    db.transactions.push(toTransaction);
    await saveDatabaseAsync();

    return fromTransaction;
  },

  async createInstallments(data: CreateTransactionDto): Promise<Transaction> {
    // CORREÇÃO CRÍTICA: Parcelamento distribuído corretamente por competência
    const db = getDatabase();
    const totalAmount = Math.abs(data.amount_cents);
    const installments = data.installments || 1;
    const installmentAmount = Math.floor(totalAmount / installments);
    // Ajustar última parcela para compensar arredondamento
    const lastInstallmentAmount = totalAmount - (installmentAmount * (installments - 1));

    // Buscar cartão para obter closing_day
    let closingDay = 10; // padrão
    if (data.credit_card_id) {
      const card = await creditCardRepository.findById(data.credit_card_id);
      if (card) {
        closingDay = card.closing_day;
      }
    }

    const purchaseDate = parse(data.date, "yyyy-MM-dd", new Date());
    
    // REGRA: Calcular competência da primeira parcela baseado na data da compra e fechamento
    const firstCompetence = getCompetenceForPurchase(purchaseDate, closingDay);
    
    // Calcular data e competência de cada parcela
    const firstParcelDate = purchaseDate;
    const firstParcelCompetence = firstCompetence;

    const newId = db.transactions.length > 0 ? Math.max(...db.transactions.map((t: Transaction) => t.id)) + 1 : 1;

    // Criar primeira parcela
    const parentTransaction: Transaction = {
      id: newId,
      type: data.type,
      amount_cents: -installmentAmount,
      date: format(firstParcelDate, "yyyy-MM-dd"),
      competence_month: firstParcelCompetence,
      description: data.description ?? undefined,
      account_id: data.account_id || null,
      credit_card_id: data.credit_card_id || null,
      category_id: data.category_id || null,
      installment_number: 1,
      installment_total: installments,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.transactions.push(parentTransaction);

    // REGRA: Criar demais parcelas distribuídas mês a mês
    for (let i = 2; i <= installments; i++) {
      // Cada parcela é no mês seguinte à anterior
      const installmentDate = addMonths(firstParcelDate, i - 1);
      const installmentCompetence = format(installmentDate, "yyyy-MM");

      // Calcular ID único para cada parcela
      const maxId = db.transactions.length > 0 ? Math.max(...db.transactions.map((t: Transaction) => t.id)) : 0;
      const installmentId = maxId + (i - 1);
      const isLast = i === installments;
      const installment: Transaction = {
        id: installmentId,
        type: data.type,
        amount_cents: -(isLast ? lastInstallmentAmount : installmentAmount),
        date: format(installmentDate, "yyyy-MM-dd"),
        competence_month: installmentCompetence,
        description: data.description ? `${data.description} (${i}/${installments})` : undefined,
        account_id: data.account_id || null,
        credit_card_id: data.credit_card_id || null,
        category_id: data.category_id || null,
        installment_number: i,
        installment_total: installments,
        parent_transaction_id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.transactions.push(installment);
    }

    // REGRA CRÍTICA: Limite é reduzido pelo valor total imediatamente
    // Fatura atual soma apenas parcelas cuja competence_month está no ciclo atual
    if (data.credit_card_id) {
      await creditCardRepository.updateAvailableLimit(data.credit_card_id, -totalAmount);
    }

    await saveDatabaseAsync();
    
    // Emitir evento de mudança de dados
    emitAppEvent("data:changed");
    
    return parentTransaction;
  },

  async update(id: number, data: Partial<CreateTransactionDto>): Promise<Transaction> {
    const db = getDatabase();
    const index = db.transactions.findIndex((t: Transaction) => t.id === id);
    if (index === -1) throw new Error("Transaction not found");

    db.transactions[index] = {
      ...db.transactions[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    await saveDatabaseAsync();
    
    // Emitir evento de mudança de dados
    emitAppEvent("data:changed");
    
    return db.transactions[index];
  },

  async delete(id: number): Promise<void> {
    const db = getDatabase();
    const transaction = db.transactions.find((t: Transaction) => t.id === id);
    if (!transaction) return;

    // REGRA: Transferências sempre em par - excluir uma exclui a outra
    if (transaction.type === "transfer" && transaction.transfer_id) {
      db.transactions = db.transactions.filter(
        (t: Transaction) => t.transfer_id !== transaction.transfer_id
      );
    }
    // REGRA: Parcelamento - excluir pai exclui todas as parcelas
    else if (transaction.parent_transaction_id === null || transaction.parent_transaction_id === undefined) {
      db.transactions = db.transactions.filter(
        (t: Transaction) => t.parent_transaction_id !== id && t.id !== id
      );
    } else {
      db.transactions = db.transactions.filter((t: Transaction) => t.id !== id);
    }

    // REGRA: Ao excluir compra, restaurar limite disponível
    if (transaction.credit_card_id && transaction.type === "credit_card_charge") {
      // Se for parcela, restaurar valor da parcela
      // Se for compra à vista, restaurar valor total
      const amountToRestore = transaction.parent_transaction_id 
        ? Math.abs(transaction.amount_cents) // Parcela individual
        : Math.abs(transaction.amount_cents); // Compra à vista
      
      await creditCardRepository.updateAvailableLimit(
        transaction.credit_card_id,
        amountToRestore
      );
    }

    await saveDatabaseAsync();
    
    // Emitir evento de mudança de dados
    emitAppEvent("data:changed");
  },

  async clear(): Promise<void> {
    const db = getDatabase();
    db.transactions = [];
    await saveDatabaseAsync();
  },

  async replaceAll(transactions: Transaction[]): Promise<void> {
    const db = getDatabase();
    db.transactions = transactions;
    await saveDatabaseAsync();
  },
};
