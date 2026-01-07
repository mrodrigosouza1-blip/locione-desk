/**
 * Constantes com todas as keys de tradução para o módulo Accounts.
 */
export const AKC = {
  // Títulos
  title: "accounts.title",
  subtitle: "accounts.subtitle",
  new: "accounts.new",
  newAccount: "accounts.newAccount",
  
  // Empty states
  empty: {
    title: "accounts.empty.title",
    subtitle: "accounts.empty.subtitle",
    message: "accounts.empty.message",
    cta: "accounts.empty.cta",
    createFirst: "accounts.empty.createFirst",
  },
  
  // Fields
  fields: {
    name: "accounts.fields.name",
    type: "accounts.fields.type",
    currency: "accounts.fields.currency",
    initialBalance: "accounts.fields.initialBalance",
  },
  
  // Account types
  types: {
    checking: "accounts.types.checking",
    savings: "accounts.types.savings",
    cash: "accounts.types.cash",
    other: "accounts.types.other",
  },
  
  // Transaction types (usado em AccountDetailPage)
  transactionTypes: {
    income: "accounts.transactionTypes.income",
    expense: "accounts.transactionTypes.expense",
    transfer: "accounts.transactionTypes.transfer",
  },
  
  // Transaction fields (usado em AccountDetailPage)
  transactionFields: {
    type: "accounts.transactionFields.type",
    amount: "accounts.transactionFields.amount",
    date: "accounts.transactionFields.date",
    description: "accounts.transactionFields.description",
    category: "accounts.transactionFields.category",
    competenceMonth: "accounts.transactionFields.competenceMonth",
  },
  
  // Actions
  editAccount: "accounts.editAccount",
  deleteAccount: "accounts.deleteAccount",
  deleteAccountMessage: "accounts.deleteAccountMessage",
  deleteAccountCascade: "accounts.deleteAccountCascade",
  deleteAccountCascadeDesc: "accounts.deleteAccountCascadeDesc",
  deleteAccountUnlink: "accounts.deleteAccountUnlink",
  deleteAccountUnlinkDesc: "accounts.deleteAccountUnlinkDesc",
  deleteAccountConfirm: "accounts.deleteAccountConfirm",
  
  // Messages
  messages: {
    createSuccess: "accounts.messages.createSuccess",
    updateSuccess: "accounts.messages.updateSuccess",
    deleteSuccess: "accounts.messages.deleteSuccess",
    deleteError: "accounts.messages.deleteError",
  },
} as const;

