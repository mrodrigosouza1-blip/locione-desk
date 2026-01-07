/**
 * Constantes com todas as keys de tradução para o módulo Credit Cards.
 */
export const CCK = {
  // Títulos
  title: "creditCards.title",
  subtitle: "creditCards.subtitle",
  new: "creditCards.new",
  newCard: "creditCards.newCard",
  
  // Empty states
  empty: {
    title: "creditCards.empty.title",
    message: "creditCards.empty.message",
    cta: "creditCards.empty.cta",
    createFirst: "creditCards.empty.createFirst",
  },
  
  // Fields
  fields: {
    name: "creditCards.fields.name",
    limitTotal: "creditCards.fields.limitTotal",
    limitAvailable: "creditCards.fields.limitAvailable",
    limitAvailableInitial: "creditCards.fields.limitAvailableInitial",
    closingDay: "creditCards.fields.closingDay",
    dueDay: "creditCards.fields.dueDay",
  },
  
  // Labels
  currentInvoice: "creditCards.currentInvoice",
  availableLimit: "creditCards.availableLimit",
  invoice: "creditCards.invoice",
  current: "creditCards.current",
  newPurchase: "creditCards.newPurchase",
  payInvoice: "creditCards.payInvoice",
  pay: "creditCards.pay",
  
  // Invoice/Detail
  invoiceEmpty: "creditCards.invoiceEmpty",
  invoiceTotal: "creditCards.invoiceTotal",
  transactions: "creditCards.transactions",
  transactionsEmpty: "creditCards.transactionsEmpty",
  
  // Table headers
  tableHeaders: {
    date: "creditCards.tableHeaders.date",
    description: "creditCards.tableHeaders.description",
    type: "creditCards.tableHeaders.type",
    installment: "creditCards.tableHeaders.installment",
    amount: "creditCards.tableHeaders.amount",
  },
  
  // Transaction types
  transactionTypes: {
    purchase: "creditCards.transactionTypes.purchase",
    payment: "creditCards.transactionTypes.payment",
  },
  
  // Purchase modal fields
  purchaseFields: {
    amount: "creditCards.purchaseFields.amount",
    installments: "creditCards.purchaseFields.installments",
    date: "creditCards.purchaseFields.date",
    competenceMonth: "creditCards.purchaseFields.competenceMonth",
    category: "creditCards.purchaseFields.category",
    description: "creditCards.purchaseFields.description",
  },
  
  // Payment modal fields
  paymentFields: {
    account: "creditCards.paymentFields.account",
    amount: "creditCards.paymentFields.amount",
    amountPlaceholder: "creditCards.paymentFields.amountPlaceholder",
    date: "creditCards.paymentFields.date",
  },
  
  // Purchase details
  purchaseTotal: "creditCards.purchaseTotal",
  
  // Actions
  editCard: "creditCards.editCard",
  deleteCard: "creditCards.deleteCard",
  deleteCardMessage: "creditCards.deleteCardMessage",
  deleteCardCascade: "creditCards.deleteCardCascade",
  deleteCardCascadeDesc: "creditCards.deleteCardCascadeDesc",
  deleteCardUnlink: "creditCards.deleteCardUnlink",
  deleteCardUnlinkDesc: "creditCards.deleteCardUnlinkDesc",
  deleteCardConfirm: "creditCards.deleteCardConfirm",
  
  // Messages
  messages: {
    createSuccess: "creditCards.messages.createSuccess",
    updateSuccess: "creditCards.messages.updateSuccess",
    deleteSuccess: "creditCards.messages.deleteSuccess",
    deleteError: "creditCards.messages.deleteError",
  },
} as const;

