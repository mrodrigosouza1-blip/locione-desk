import { getDatabase, saveDatabaseAsync } from "../database";
import type { Account, CreateAccountDto, Transaction } from "../../domain/types";

export const accountRepository = {
  async findAll(): Promise<Account[]> {
    const db = getDatabase();
    // Garantir que contas antigas tenham currency_code
    const accounts = db.accounts.map((account: Account) => ({
      ...account,
      currency_code: account.currency_code || "BRL", // Migração: contas antigas recebem BRL
    }));
    return accounts.sort((a: Account, b: Account) => a.name.localeCompare(b.name));
  },

  async findById(id: number): Promise<Account | undefined> {
    const db = getDatabase();
    const account = db.accounts.find((a: Account) => a.id === id);
    if (account && !account.currency_code) {
      // Migração: conta antiga recebe BRL
      account.currency_code = "BRL";
    }
    return account;
  },

  async create(data: CreateAccountDto): Promise<Account> {
    const db = getDatabase();
    const newId = db.accounts.length > 0 ? Math.max(...db.accounts.map((a: Account) => a.id)) + 1 : 1;
    const account: Account = {
      id: newId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.accounts.push(account);
    await saveDatabaseAsync();
    return account;
  },

  async update(id: number, data: Partial<CreateAccountDto>): Promise<Account> {
    const db = getDatabase();
    const index = db.accounts.findIndex((a: Account) => a.id === id);
    if (index === -1) throw new Error("Account not found");
    
    db.accounts[index] = {
      ...db.accounts[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    await saveDatabaseAsync();
    return db.accounts[index];
  },

  async delete(id: number, options?: { cascade?: boolean }): Promise<void> {
    const db = getDatabase();
    
    if (options?.cascade) {
      // Excluir transações vinculadas
      db.transactions = db.transactions.filter((t: Transaction) => t.account_id !== id);
    } else {
      // Desvincular transações (set account_id = null)
      db.transactions.forEach((t: Transaction) => {
        if (t.account_id === id) {
          t.account_id = undefined;
        }
      });
    }
    
    db.accounts = db.accounts.filter((a: Account) => a.id !== id);
    await saveDatabaseAsync();
  },

  async getBalance(accountId: number): Promise<number> {
    // REGRA: saldo = saldo_inicial + soma(lançamentos)
    const account = await this.findById(accountId);
    if (!account) return 0;

    const db = getDatabase();
    // Incluir todas as transações da conta (incluindo transferências, metas, etc)
    const transactions = db.transactions.filter(
      (t: Transaction) => t.account_id === accountId
    );
    const total = transactions.reduce((sum: number, t: Transaction) => sum + t.amount_cents, 0);

    return account.initial_balance_cents + total;
  },

  async getBalanceWithoutGoals(accountId: number): Promise<number> {
    // REGRA: Saldo sem metas (excluir goal_deposit e goal_withdraw)
    const account = await this.findById(accountId);
    if (!account) return 0;

    const db = getDatabase();
    const transactions = db.transactions.filter(
      (t: Transaction) => 
        t.account_id === accountId &&
        t.type !== "goal_deposit" &&
        t.type !== "goal_withdraw"
    );
    const total = transactions.reduce((sum: number, t: Transaction) => sum + t.amount_cents, 0);

    return account.initial_balance_cents + total;
  },

  async getGoalsBalance(accountId: number): Promise<number> {
    // REGRA: Saldo de metas (apenas goal_deposit e goal_withdraw)
    const db = getDatabase();
    const transactions = db.transactions.filter(
      (t: Transaction) => 
        t.account_id === accountId &&
        (t.type === "goal_deposit" || t.type === "goal_withdraw")
    );
    return transactions.reduce((sum: number, t: Transaction) => sum + t.amount_cents, 0);
  },

  async clear(): Promise<void> {
    const db = getDatabase();
    db.accounts = [];
    await saveDatabaseAsync();
  },

  async replaceAll(accounts: Account[]): Promise<void> {
    const db = getDatabase();
    db.accounts = accounts;
    await saveDatabaseAsync();
  },
};
