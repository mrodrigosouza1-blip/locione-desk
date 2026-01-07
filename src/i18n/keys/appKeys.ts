/**
 * Constantes com todas as keys de tradução para navegação/layout global.
 * Isso evita typos e facilita refatoração.
 */
export const AK = {
  // Navigation
  nav: {
    dashboard: "nav.dashboard",
    accounts: "nav.accounts",
    creditCards: "nav.creditCards",
    transactions: "nav.transactions",
    categories: "nav.categories",
    goals: "nav.goals",
    budgets: "nav.budgets",
    reports: "nav.reports",
    settings: "nav.settings",
    about: "nav.about",
    plan: "nav.plan",
  },
  
  // Premium
  premium: {
    annual: "premium.annual",
    lifetime: "premium.lifetime",
  },
  
  // Common actions (usados globalmente)
  common: {
    save: "common.save",
    cancel: "common.cancel",
    delete: "common.delete",
    close: "common.close",
    edit: "common.edit",
    new: "common.new",
    create: "common.create",
    add: "common.add",
    search: "common.search",
    filter: "common.filter",
    export: "common.export",
    import: "common.import",
    importReceipt: "common.importReceipt",
    confirm: "common.confirm",
    yes: "common.yes",
    no: "common.no",
    loading: "common.loading",
    error: "common.error",
    success: "common.success",
    back: "common.back",
    next: "common.next",
    previous: "common.previous",
    choose: "common.choose",
    select: "common.select",
    all: "common.all",
    none: "common.none",
    today: "common.today",
    thisMonth: "common.thisMonth",
    thisYear: "common.thisYear",
    view: "common.view",
    details: "common.details",
    refresh: "common.refresh",
    newTransaction: "common.newTransaction",
    processing: "common.processing",
    note: "common.note",
    attention: "common.attention",
    moreActions: "common.moreActions",
    lockNow: "common.lockNow",
    filters: "common.filters",
    preview: "common.preview",
    copy: "common.copy",
    reload: "common.reload",
    selectCurrency: "common.selectCurrency",
    selectAccount: "common.selectAccount",
    account: "common.account",
    creditCard: "common.creditCard",
    chooseTransactionType: "common.chooseTransactionType",
    safeModeActive: "common.safeModeActive",
    safeModeDescription: "common.safeModeDescription",
    safeModeDeactivated: "common.safeModeDeactivated",
    openDiagnostics: "common.openDiagnostics",
    resetSettings: "common.resetSettings",
    restoreBackup: "common.restoreBackup",
    deactivateSafeMode: "common.deactivateSafeMode",
    currencies: {
      brl: "common.currencies.brl",
      usd: "common.currencies.usd",
      eur: "common.currencies.eur",
      gbp: "common.currencies.gbp",
    },
  },
  
  // Error Boundary
  errorBoundary: {
    title: "errorBoundary.title",
    message: "errorBoundary.message",
    details: "errorBoundary.details",
    reload: "errorBoundary.reload",
  },
  
  // Currency Select
  currencySelect: {
    placeholder: "currencySelect.placeholder",
  },
  
  // Confirm Delete
  confirmDelete: {
    message: "confirmDelete.message",
  },
  
  // App title
  app: {
    title: "app.title",
  },
  
  // Transaction types
  txType: {
    income: "txType.income",
    expense: "txType.expense",
    transfer: "txType.transfer",
    adjustment: "txType.adjustment",
    goalDeposit: "txType.goalDeposit",
    goalWithdraw: "txType.goalWithdraw",
    creditCardCharge: "txType.creditCardCharge",
    cardPayment: "txType.cardPayment",
  },
} as const;

