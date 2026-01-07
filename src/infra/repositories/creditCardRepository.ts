import { getDatabase, saveDatabaseAsync } from "../database";
import type { CreditCard, CreateCreditCardDto } from "../../domain/types";
import { getCurrentInvoice as getCurrentInvoiceFromService } from "../../domain/invoiceService";
import { transactionRepository } from "./transactionRepository";

export const creditCardRepository = {
  async findAll(): Promise<CreditCard[]> {
    const db = getDatabase();
    return db.creditCards.sort((a: CreditCard, b: CreditCard) => a.name.localeCompare(b.name));
  },

  async findById(id: number): Promise<CreditCard | undefined> {
    const db = getDatabase();
    return db.creditCards.find((c: CreditCard) => c.id === id);
  },

  async create(data: CreateCreditCardDto): Promise<CreditCard> {
    const db = getDatabase();
    const newId = db.creditCards.length > 0 ? Math.max(...db.creditCards.map((c: CreditCard) => c.id)) + 1 : 1;
    const card: CreditCard = {
      id: newId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.creditCards.push(card);
    await saveDatabaseAsync();
    return card;
  },

  async update(id: number, data: Partial<CreateCreditCardDto>): Promise<CreditCard> {
    const db = getDatabase();
    const index = db.creditCards.findIndex((c: CreditCard) => c.id === id);
    if (index === -1) throw new Error("Credit card not found");
    
    db.creditCards[index] = {
      ...db.creditCards[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    await saveDatabaseAsync();
    return db.creditCards[index];
  },

  async delete(id: number, options?: { cascade?: boolean }): Promise<void> {
    const db = getDatabase();
    
    if (options?.cascade) {
      // Excluir transações vinculadas
      const transactions = db.transactions.filter((t: any) => t.credit_card_id === id);
      for (const transaction of transactions) {
        await transactionRepository.delete(transaction.id);
      }
    } else {
      // Desvincular transações (set credit_card_id = null)
      db.transactions.forEach((t: any) => {
        if (t.credit_card_id === id) {
          t.credit_card_id = undefined;
        }
      });
    }
    
    db.creditCards = db.creditCards.filter((c: CreditCard) => c.id !== id);
    await saveDatabaseAsync();
  },

  async getCurrentInvoice(cardId: number, referenceDate?: Date): Promise<number> {
    // FUNÇÃO CENTRAL: Usa serviço de domínio para calcular fatura
    const invoice = getCurrentInvoiceFromService(cardId, referenceDate);
    return invoice.invoice_total_cents;
  },

  async getCurrentInvoiceWithItems(cardId: number, referenceDate?: Date) {
    // Retorna fatura completa com itens
    return getCurrentInvoiceFromService(cardId, referenceDate);
  },

  async updateAvailableLimit(cardId: number, amountCents: number): Promise<void> {
    const db = getDatabase();
    const card = db.creditCards.find((c: CreditCard) => c.id === cardId);
    if (card) {
      card.limit_available_cents += amountCents;
      card.updated_at = new Date().toISOString();
      await saveDatabaseAsync();
    }
  },
};
