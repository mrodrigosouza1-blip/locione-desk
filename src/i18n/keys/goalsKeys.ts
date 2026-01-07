/**
 * Constantes com todas as keys de tradução para o módulo Goals.
 */
export const GK = {
  // Títulos
  title: "goals.title",
  subtitle: "goals.subtitle",
  new: "goals.new",
  newGoal: "goals.newGoal",
  
  // Empty states
  empty: {
    title: "goals.empty.title",
  },
  
  // Fields
  fields: {
    name: "goals.fields.name",
    namePlaceholder: "goals.fields.namePlaceholder",
    type: "goals.fields.type",
    currency: "goals.fields.currency",
    targetValue: "goals.fields.targetValue",
    account: "goals.fields.account",
    amount: "goals.fields.amount",
    destinationAccount: "goals.fields.destinationAccount",
    valueWithCurrency: "goals.fields.valueWithCurrency",
  },
  
  // Details Modal
  details: {
    withdrawFromAccount: "goals.details.withdrawFromAccount",
    selectAccount: "goals.details.selectAccount",
    configNotFound: "goals.details.configNotFound",
    configLoadError: "goals.details.configLoadError",
    selectSteps: "goals.details.selectSteps",
    month: "goals.details.month",
    selectDates: "goals.details.selectDates",
    depositAmount: "goals.details.depositAmount",
  },
  
  // Goal types
  types: {
    steps: "goals.types.steps",
    monthly: "goals.types.monthly",
    free: "goals.types.free",
  },
  
  // Steps configuration
  steps: {
    title: "goals.steps.title",
    totalSteps: "goals.steps.totalSteps",
    valueMode: "goals.steps.valueMode",
    fixedPerStep: "goals.steps.fixedPerStep",
    progressive: "goals.steps.progressive",
    valuePerStep: "goals.steps.valuePerStep",
    totalValue: "goals.steps.totalValue",
    example: "goals.steps.example",
  },
  
  // Monthly configuration
  monthly: {
    title: "goals.monthly.title",
    selectedMonths: "goals.monthly.selectedMonths",
    selectAtLeastOne: "goals.monthly.selectAtLeastOne",
    dailyMode: "goals.monthly.dailyMode",
    fixedPerDay: "goals.monthly.fixedPerDay",
    dayValue: "goals.monthly.dayValue",
    valuePerDay: "goals.monthly.valuePerDay",
    totalValue: "goals.monthly.totalValue",
    example: "goals.monthly.example",
  },
  
  // Free configuration
  free: {
    title: "goals.free.title",
    description: "goals.free.description",
    targetValue: "goals.free.targetValue",
    totalValue: "goals.free.totalValue",
  },
  
  // Wizard
  wizard: {
    title: "goals.wizard.title",
    step: "goals.wizard.step",
    step1Title: "goals.wizard.step1Title",
    step2Title: "goals.wizard.step2Title",
    step3Title: "goals.wizard.step3Title",
    typeDescription: {
      steps: "goals.wizard.typeDescription.steps",
      monthly: "goals.wizard.typeDescription.monthly",
      free: "goals.wizard.typeDescription.free",
    },
    nameMinLength: "goals.wizard.nameMinLength",
    valueMustBePositive: "goals.wizard.valueMustBePositive",
    customSteps: "goals.wizard.customSteps",
    customStepsLabel: "goals.wizard.customStepsLabel",
    howToCalculate: "goals.wizard.howToCalculate",
    valueEqualsStepNumber: "goals.wizard.valueEqualsStepNumber",
    valueEqualsStepNumberDesc: "goals.wizard.valueEqualsStepNumberDesc",
    valueEqualsDayNumber: "goals.wizard.valueEqualsDayNumber",
    valueEqualsDayNumberDesc: "goals.wizard.valueEqualsDayNumberDesc",
    monthsIncluded: "goals.wizard.monthsIncluded",
    createGoal: "goals.wizard.createGoal",
  },
  
  // Display
  display: {
    current: "goals.display.current",
    target: "goals.display.target",
    completed: "goals.display.completed",
    details: "goals.display.details",
    withdraw: "goals.display.withdraw",
    stepAlreadyDeposited: "goals.display.stepAlreadyDeposited",
  },
  
  // Modals
  modals: {
    create: {
      title: "goals.modals.create.title",
    },
    deposit: {
      title: "goals.modals.deposit.title",
      selectAccount: "goals.modals.deposit.selectAccount",
    },
    withdraw: {
      title: "goals.modals.withdraw.title",
      selectAccount: "goals.modals.withdraw.selectAccount",
      amount: "goals.modals.withdraw.amount",
    },
  },
  
  // Actions
  actions: {
    cancel: "goals.actions.cancel",
    create: "goals.actions.create",
    deposit: "goals.actions.deposit",
    withdraw: "goals.actions.withdraw",
    continue: "goals.actions.continue",
    back: "goals.actions.back",
    edit: "goals.actions.edit",
    delete: "goals.actions.delete",
  },
  
  // Edit/Delete
  editGoal: "goals.editGoal",
  deleteGoal: "goals.deleteGoal",
  deleteGoalMessage: "goals.deleteGoalMessage",
  deleteGoalCascade: "goals.deleteGoalCascade",
  deleteGoalCascadeDesc: "goals.deleteGoalCascadeDesc",
  deleteGoalKeep: "goals.deleteGoalKeep",
  deleteGoalKeepDesc: "goals.deleteGoalKeepDesc",
  deleteGoalConfirm: "goals.deleteGoalConfirm",
  
  // Messages
  messages: {
    nameRequired: "goals.messages.nameRequired",
    createSuccess: "goals.messages.createSuccess",
    updateSuccess: "goals.messages.updateSuccess",
    deleteSuccess: "goals.messages.deleteSuccess",
    deleteError: "goals.messages.deleteError",
    currencyRequired: "goals.messages.currencyRequired",
    stepsMin: "goals.messages.stepsMin",
    stepValueRequired: "goals.messages.stepValueRequired",
    monthRequired: "goals.messages.monthRequired",
    monthRange: "goals.messages.monthRange",
    dayValueRequired: "goals.messages.dayValueRequired",
    targetValueRequired: "goals.messages.targetValueRequired",
    createError: "goals.messages.createError",
    selectAccount: "goals.messages.selectAccount",
    valueMustBePositive: "goals.messages.valueMustBePositive",
    depositError: "goals.messages.depositError",
    stepsAlreadyDeposited: "goals.messages.stepsAlreadyDeposited",
    insufficientBalance: "goals.messages.insufficientBalance",
    accountNotFound: "goals.messages.accountNotFound",
    currencyMismatch: "goals.messages.currencyMismatch",
    withdrawSuccess: "goals.messages.withdrawSuccess",
    withdrawError: "goals.messages.withdrawError",
  },
  
  // Month names (for display)
  months: {
    january: "goals.months.january",
    february: "goals.months.february",
    march: "goals.months.march",
    april: "goals.months.april",
    may: "goals.months.may",
    june: "goals.months.june",
    july: "goals.months.july",
    august: "goals.months.august",
    september: "goals.months.september",
    october: "goals.months.october",
    november: "goals.months.november",
    december: "goals.months.december",
  },
} as const;

