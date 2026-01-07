import { AK } from "../../i18n/keys/appKeys";

export type TransactionType = 
  | "income" 
  | "expense" 
  | "transfer" 
  | "adjustment" 
  | "goal_deposit" 
  | "goal_withdraw"
  | "credit_card_charge"
  | "card_payment";

type TFunction = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Retorna o label traduzido para o tipo de transação
 */
export function getTxTypeLabel(t: TFunction, type: string): string {
  switch (type) {
    case "income":
      return t(AK.txType.income);
    case "expense":
      return t(AK.txType.expense);
    case "transfer":
      return t(AK.txType.transfer);
    case "adjustment":
      return t(AK.txType.adjustment);
    case "goal_deposit":
      return t(AK.txType.goalDeposit);
    case "goal_withdraw":
      return t(AK.txType.goalWithdraw);
    case "credit_card_charge":
      return t(AK.txType.creditCardCharge);
    case "card_payment":
      return t(AK.txType.cardPayment);
    default:
      return type; // Fallback: retorna o valor bruto se não encontrar
  }
}

