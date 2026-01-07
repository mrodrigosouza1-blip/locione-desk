/**
 * Constantes com todas as keys de tradução para CreditCardDetailPage.
 */
export const CCDK = {
  notFound: "creditCardDetail.notFound",
  newPurchase: "creditCardDetail.newPurchase",
  payInvoice: "creditCardDetail.payInvoice",
  modals: {
    newPurchase: {
      title: "creditCardDetail.modals.newPurchase.title",
      fields: {
        amount: "creditCardDetail.modals.newPurchase.fields.amount",
        installments: "creditCardDetail.modals.newPurchase.fields.installments",
        date: "creditCardDetail.modals.newPurchase.fields.date",
        competenceMonth: "creditCardDetail.modals.newPurchase.fields.competenceMonth",
        category: "creditCardDetail.modals.newPurchase.fields.category",
        description: "creditCardDetail.modals.newPurchase.fields.description",
      },
    },
    payInvoice: {
      title: "creditCardDetail.modals.payInvoice.title",
      fields: {
        account: "creditCardDetail.modals.payInvoice.fields.account",
        amount: "creditCardDetail.modals.payInvoice.fields.amount",
        amountPlaceholder: "creditCardDetail.modals.payInvoice.fields.amountPlaceholder",
        date: "creditCardDetail.modals.payInvoice.fields.date",
      },
      selectAccount: "creditCardDetail.modals.payInvoice.selectAccount",
    },
  },
  messages: {
    insufficientLimit: "creditCardDetail.messages.insufficientLimit",
  },
  purchaseDetails: {
    totalPurchase: "creditCardDetail.purchaseDetails.totalPurchase",
  },
} as const;


