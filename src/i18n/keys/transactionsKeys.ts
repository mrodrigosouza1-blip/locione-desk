/**
 * Constantes com todas as keys de tradução para o módulo Transactions.
 */
export const TX = {
  // Títulos
  title: "transactions.title",
  new: "transactions.new",
  newTransaction: "transactions.newTransaction",
  
  // Ações
  saveOne: "transactions.saveOne",
  saveMany: "transactions.saveMany",
  saving: "transactions.saving",
  
  // Períodos (para Topbar)
  period: {
    last7Days: "transactions.period.last7Days",
    last15Days: "transactions.period.last15Days",
    last30Days: "transactions.period.last30Days",
    month: "transactions.period.month",
    custom: "transactions.period.custom",
  },
} as const;

