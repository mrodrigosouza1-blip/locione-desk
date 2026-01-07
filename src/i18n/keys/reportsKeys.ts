/**
 * Constantes com todas as keys de tradução para o módulo Reports.
 */
export const RK = {
  // Títulos
  title: "reports.title",
  subtitle: "reports.subtitle",
  financialReport: "reports.financialReport",
  
  // Loading
  loading: "reports.loading",
  
  // Filtros
  period: "reports.period",
  account: "reports.account",
  allAccounts: "reports.allAccounts",
  currency: "reports.currency",
  allCurrencies: "reports.allCurrencies",
  movementFilter: "reports.movementFilter",
  movementFilterAll: "reports.movementFilter.all",
  movementFilterIncome: "reports.movementFilter.income",
  movementFilterExpense: "reports.movementFilter.expense",
  movementTypeLabel: "reports.movementTypeLabel",
  
  // Períodos
  periodCurrentMonth: "reports.period.currentMonth",
  periodLastMonth: "reports.period.lastMonth",
  periodLast3Months: "reports.period.last3Months",
  periodLast6Months: "reports.period.last6Months",
  periodCustom: "reports.period.custom",
  periodStartDate: "reports.period.startDate",
  periodEndDate: "reports.period.endDate",
  
  // Moeda
  currencyAuto: "reports.currencyAuto",
  currencyLabel: "reports.currencyLabel",
  
  // Export
  export: "reports.export",
  exportCSV: "reports.exportCSV",
  exportPDF: "reports.exportPDF",
  print: "reports.print",
  
  // Preview Modal
  previewTitle: "reports.previewTitle",
  previewCSVTitle: "reports.previewCSVTitle",
  previewTotalTransactions: "reports.previewTotalTransactions",
  previewPeriod: "reports.previewPeriod",
  previewAccount: "reports.previewAccount",
  previewCurrency: "reports.previewCurrency",
  previewMoreTransactions: "reports.previewMoreTransactions",
  previewDownloadCSV: "reports.previewDownloadCSV",
  previewDownloadPDF: "reports.previewDownloadPDF",
  previewOpenPrint: "reports.previewOpenPrint",
  
  // CSV Headers
  csvHeaders: {
    date: "reports.csvHeaders.date",
    type: "reports.csvHeaders.type",
    description: "reports.csvHeaders.description",
    category: "reports.csvHeaders.category",
    amount: "reports.csvHeaders.amount",
    account: "reports.csvHeaders.account",
    currency: "reports.csvHeaders.currency",
  },
  
  // CSV Types
  csvTypeIncome: "reports.csvType.income",
  csvTypeExpense: "reports.csvType.expense",
  csvTypeCardPayment: "reports.csvType.cardPayment",
  csvNoCategory: "reports.csvNoCategory",
  
  // CSV Export Warning
  csvExportWarning: "reports.csvExportWarning",
  
  // Multi-currency warning
  multiCurrencyWarning: "reports.multiCurrencyWarning",
  
  // Relatório
  reportPeriod: "reports.reportPeriod",
  reportAccount: "reports.reportAccount",
  reportCurrency: "reports.reportCurrency",
  
  // Empty State
  emptyTitle: "reports.empty.title",
  emptyMessage: "reports.empty.message",
  emptyCta: "reports.empty.cta",
  
  // Filters
  filtersTitle: "reports.filters.title",
} as const;

