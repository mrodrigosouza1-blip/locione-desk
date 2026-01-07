/**
 * Constantes com todas as keys de tradução para o módulo Budgets.
 */
export const BK = {
  // Títulos
  title: "budgets.title",
  subtitle: "budgets.subtitle",
  new: "budgets.new",
  newBudget: "budgets.newBudget",
  
  // Empty states
  empty: {
    title: "budgets.empty.title",
    noCritical: "budgets.empty.noCritical",
  },
  
  // Fields
  fields: {
    category: "budgets.fields.category",
    month: "budgets.fields.month",
    budgetValue: "budgets.fields.budgetValue",
    selectCategory: "budgets.fields.selectCategory",
  },
  
  // Display
  display: {
    spent: "budgets.display.spent",
    budget: "budgets.display.budget",
    remaining: "budgets.display.remaining",
    used: "budgets.display.used",
    over: "budgets.display.over",
    critical: "budgets.display.critical",
    categoryNotFound: "budgets.display.categoryNotFound",
  },
  
  // Filters
  filters: {
    showAll: "budgets.filters.showAll",
    showCritical: "budgets.filters.showCritical",
  },
  
  // Modals
  modals: {
    create: {
      title: "budgets.modals.create.title",
    },
    edit: {
      title: "budgets.modals.edit.title",
    },
  },
  
  // Actions
  actions: {
    cancel: "budgets.actions.cancel",
    create: "budgets.actions.create",
    save: "budgets.actions.save",
    edit: "budgets.actions.edit",
    delete: "budgets.actions.delete",
  },
  
  // Messages
  messages: {
    deleteConfirm: "budgets.messages.deleteConfirm",
    createSuccess: "budgets.messages.createSuccess",
    updateSuccess: "budgets.messages.updateSuccess",
    deleteSuccess: "budgets.messages.deleteSuccess",
    deleteError: "budgets.messages.deleteError",
  },
} as const;

