import { getDatabase, saveDatabaseAsync } from "../database";
import type { Budget, CreateBudgetDto, Transaction } from "../../domain/types";

export const budgetRepository = {
  async findAll(month?: string): Promise<Budget[]> {
    const db = getDatabase();
    let budgets = [...db.budgets];

    if (month) {
      budgets = budgets.filter((b) => b.month === month);
    }

    return budgets.sort((a, b) => {
      if (a.month !== b.month) return b.month.localeCompare(a.month);
      return b.created_at.localeCompare(a.created_at);
    });
  },

  async findById(id: number): Promise<Budget | undefined> {
    const db = getDatabase();
    return db.budgets.find((b: Budget) => b.id === id);
  },

  async findByCategoryAndMonth(categoryId: number, month: string): Promise<Budget | undefined> {
    const db = getDatabase();
    return db.budgets.find((b: Budget) => b.category_id === categoryId && b.month === month);
  },

  async create(data: CreateBudgetDto): Promise<Budget> {
    const db = getDatabase();
    const newId = db.budgets.length > 0 ? Math.max(...db.budgets.map((b) => b.id)) + 1 : 1;
    const budget: Budget = {
      id: newId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.budgets.push(budget);
    await saveDatabaseAsync();
    return budget;
  },

  async update(id: number, data: Partial<CreateBudgetDto>): Promise<Budget> {
    const db = getDatabase();
    const index = db.budgets.findIndex((b: Budget) => b.id === id);
    if (index === -1) throw new Error("Budget not found");
    
    db.budgets[index] = {
      ...db.budgets[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    await saveDatabaseAsync();
    return db.budgets[index];
  },

  async delete(id: number): Promise<void> {
    const db = getDatabase();
    db.budgets = db.budgets.filter((b: Budget) => b.id !== id);
    await saveDatabaseAsync();
  },

  async getSpent(categoryId: number, month: string): Promise<number> {
    const db = getDatabase();
    const transactions = db.transactions.filter(
      (t: Transaction) =>
        t.category_id === categoryId &&
        t.competence_month === month &&
        (t.type === "expense" || t.type === "credit_card_charge")
    );

    return Math.abs(transactions.reduce((sum: number, t: Transaction) => sum + t.amount_cents, 0));
  },
};
