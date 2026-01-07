/**
 * Constantes com todas as keys de tradução para ImportReceiptModal.
 */
export const IRK = {
  title: "importReceipt.title",
  success: {
    title: "importReceipt.success.title",
    message: "importReceipt.success.message",
  },
  selectFile: {
    label: "importReceipt.selectFile.label",
    description: "importReceipt.selectFile.description",
    button: "importReceipt.selectFile.button",
    loading: "importReceipt.selectFile.loading",
  },
  preview: {
    textPreview: "importReceipt.preview.textPreview",
    itemsDetected: "importReceipt.preview.itemsDetected",
    itemsSelected: "importReceipt.preview.itemsSelected",
    actions: {
      selectAll: "importReceipt.preview.actions.selectAll",
      clear: "importReceipt.preview.actions.clear",
    },
    table: {
      date: "importReceipt.preview.table.date",
      description: "importReceipt.preview.table.description",
      amount: "importReceipt.preview.table.amount",
      suggestedCategory: "importReceipt.preview.table.suggestedCategory",
      confidence: "importReceipt.preview.table.confidence",
    },
    textExtractionError: "importReceipt.preview.textExtractionError",
  },
  form: {
    fields: {
      amount: "importReceipt.form.fields.amount",
      date: "importReceipt.form.fields.date",
      description: "importReceipt.form.fields.description",
      category: "importReceipt.form.fields.category",
      type: "importReceipt.form.fields.type",
      destination: "importReceipt.form.fields.destination",
      installments: "importReceipt.form.fields.installments",
    },
    types: {
      expense: "importReceipt.form.types.expense",
      income: "importReceipt.form.types.income",
    },
    destinations: {
      account: "importReceipt.form.destinations.account",
      card: "importReceipt.form.destinations.card",
    },
    selectAccount: "importReceipt.form.selectAccount",
    selectCard: "importReceipt.form.selectCard",
  },
  errors: {
    fileReadError: "importReceipt.errors.fileReadError",
    pdfNoText: "importReceipt.errors.pdfNoText",
    imageLimited: "importReceipt.errors.imageLimited",
    fileSelectError: "importReceipt.errors.fileSelectError",
    noDestination: "importReceipt.errors.noDestination",
    noItemsSelected: "importReceipt.errors.noItemsSelected",
    cardNotFound: "importReceipt.errors.cardNotFound",
    insufficientLimit: "importReceipt.errors.insufficientLimit",
    invalidAmount: "importReceipt.errors.invalidAmount",
    saveError: "importReceipt.errors.saveError",
  },
  placeholders: {
    amount: "importReceipt.placeholders.amount",
    merchantOrDescription: "importReceipt.placeholders.merchantOrDescription",
  },
} as const;


