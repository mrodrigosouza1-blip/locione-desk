export interface Account {
  id: number;
  name: string;
  type: "checking" | "savings" | "investment" | "other";
  currency_code: string;
  initial_balance_cents: number;
  is_system?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountDto {
  name: string;
  type: "checking" | "savings" | "investment" | "other";
  currency_code: string;
  initial_balance_cents: number;
  is_system?: boolean;
}

export interface Transaction {
  id: number;
  type: "income" | "expense" | "transfer" | "credit_card_charge" | "card_payment" | "goal_deposit" | "goal_withdraw";
  amount_cents: number;
  date: string;
  competence_month?: string;
  description?: string;
  account_id?: number | null;
  credit_card_id?: number | null;
  category_id?: number | null;
  transfer_id?: number | null;
  parent_transaction_id?: number | null;
  installment_total?: number;
  installment_number?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionDto {
  type: "income" | "expense" | "transfer" | "credit_card_charge" | "card_payment" | "goal_deposit" | "goal_withdraw";
  amount_cents: number;
  date: string;
  competence_month?: string;
  description?: string;
  account_id?: number | null;
  credit_card_id?: number | null;
  category_id?: number | null;
  installments?: number;
  from_account_id?: number;
  to_account_id?: number;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  is_system?: boolean;
  created_at: string;
}

export interface CreateCategoryDto {
  name: string;
  icon?: string;
  is_system?: boolean;
}

export interface CreditCard {
  id: number;
  name: string;
  limit_cents: number;
  limit_available_cents: number;
  closing_day: number;
  due_day: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCreditCardDto {
  name: string;
  limit_cents: number;
  limit_available_cents: number;
  closing_day: number;
  due_day: number;
  currency_code: string;
}

export interface Goal {
  id: number;
  name: string;
  type: "target" | "deadline" | "free" | "steps" | "monthly";
  currency_code: string;
  target_value_cents: number;
  deposited_amount: number;
  config?: string | Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalDto {
  name: string;
  type: "target" | "deadline" | "free" | "steps" | "monthly";
  currency_code: string;
  target_value_cents: number;
  config?: string | Record<string, unknown>;
}

export interface GoalMovement {
  id: number;
  goal_id: number;
  type: "deposit" | "withdraw" | "redeem"; // "redeem" mantido para compatibilidade
  amount_cents: number;
  currency: string;
  date: string;
  description?: string;
  source_account_id?: number;
  destination_account_id?: number;
  meta?: {
    goal_type?: string;
    selected_units?: number[] | string[];
    [key: string]: unknown;
  };
  created_at: string;
}

export interface Budget {
  id: number;
  category_id: number;
  month: string;
  amount_cents: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetDto {
  category_id: number;
  month: string;
  amount_cents: number;
}

// Settings moved to src/domain/settings.ts
// Keeping this for backward compatibility during migration
export interface Settings {
  currency: string;
  date_format: string;
  theme: "light" | "dark";
}

export interface Database {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  creditCards: CreditCard[];
  goals: Goal[];
  goalMovements: GoalMovement[];
  budgets: Budget[];
  settings: Settings | any; // Aceita formato antigo e novo (migração automática via settingsRepository)
}

