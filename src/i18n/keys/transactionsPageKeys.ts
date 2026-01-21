/**
 * Constantes com todas as keys de tradução para TransactionsPage.
 */
export const TPK = {
  // Títulos
  title: "transactionsPage.title",
  subtitle: "transactionsPage.subtitle",
  
  // Busca
  searchPlaceholder: "transactionsPage.searchPlaceholder",
  
  // Empty state
  empty: {
    title: "transactionsPage.empty.title",
  },
  
  // Tabela
  table: {
    date: "transactionsPage.table.date",
    description: "transactionsPage.table.description",
    type: "transactionsPage.table.type",
    amount: "transactionsPage.table.amount",
  },
  
  // Tipos de transação
  types: {
    income: "transactionsPage.types.income",
    expense: "transactionsPage.types.expense",
    transfer: "transactionsPage.types.transfer",
    cardPayment: "transactionsPage.types.cardPayment",
    goalDeposit: "transactionsPage.types.goalDeposit",
    goalWithdraw: "transactionsPage.types.goalWithdraw",
    creditCardCharge: "transactionsPage.types.creditCardCharge",
  },

  // Paginação simples
  showMore: "transactionsPage.showMore",
  showLess: "transactionsPage.showLess",
} as const;

