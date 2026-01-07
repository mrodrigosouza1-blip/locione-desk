/**
 * Constantes com todas as keys de tradução usadas em Settings.
 * Isso evita typos e facilita refatoração.
 */
export const SK = {
  title: "settings.title",
  subtitle: "settings.subtitle",
  
  sections: {
    preferences: "settings.sections.preferences",
    advanced: "settings.sections.advanced",
    security: "settings.sections.security",
    alerts: "settings.sections.alerts",
    backup: "settings.sections.backup",
    diagnostics: "settings.sections.diagnostics",
  },
  
  fields: {
    // Preferences
    currencyPrimary: "settings.fields.currencyPrimary",
    currencySecondaryEnable: "settings.fields.currencySecondaryEnable",
    currencySecondaryHelp: "settings.fields.currencySecondaryHelp",
    currencySecondary: "settings.fields.currencySecondary",
    manualFxRate: "settings.fields.manualFxRate",
    manualFxRateHelp: "settings.fields.manualFxRateHelp",
    dateFormat: "settings.fields.dateFormat",
    theme: "settings.fields.theme",
    themeLight: "settings.fields.themeLight",
    themeDark: "settings.fields.themeDark",
    themeSystem: "settings.fields.themeSystem",
    
    // Advanced Preferences
    language: "settings.fields.language",
    decimals: "settings.fields.decimals",
    decimalsAuto: "settings.fields.decimalsAuto",
    decimalsAutoHelp: "settings.fields.decimalsAutoHelp",
    decimals0: "settings.fields.decimals0",
    decimals0Help: "settings.fields.decimals0Help",
    decimals2: "settings.fields.decimals2",
    decimals2Help: "settings.fields.decimals2Help",
    weekStartsOn: "settings.fields.weekStartsOn",
    weekStartsOnMonday: "settings.fields.weekStartsOnMonday",
    weekStartsOnMondayHelp: "settings.fields.weekStartsOnMondayHelp",
    weekStartsOnSunday: "settings.fields.weekStartsOnSunday",
    weekStartsOnSundayHelp: "settings.fields.weekStartsOnSundayHelp",
    
    // Security
    enablePin: "settings.fields.enablePin",
    enablePinHelp: "settings.fields.enablePinHelp",
    changePin: "settings.fields.changePin",
    disablePinConfirm: "settings.fields.disablePinConfirm",
    lockOnMinimize: "settings.fields.lockOnMinimize",
    lockOnMinimizeHelp: "settings.fields.lockOnMinimizeHelp",
    lockOnBackground: "settings.fields.lockOnBackground",
    autoLockMinutes: "settings.fields.autoLockMinutes",
    autoLockMinutesValue: "settings.fields.autoLockMinutesValue",
    autoLockMinutesValuePlural: "settings.fields.autoLockMinutesValuePlural",
    autoLockDisabled: "settings.fields.autoLockDisabled",
    autoLockEnabled: "settings.fields.autoLockEnabled",
    privacyMode: "settings.fields.privacyMode",
    privacyModeHelp: "settings.fields.privacyModeHelp",
    confirmDelete: "settings.fields.confirmDelete",
    confirmDeleteHelp: "settings.fields.confirmDeleteHelp",
    
    // Alerts
    billRemindersEnabled: "settings.fields.billRemindersEnabled",
    billRemindersEnabledHelp: "settings.fields.billRemindersEnabledHelp",
    billReminderDaysBeforeClose: "settings.fields.billReminderDaysBeforeClose",
    billReminderDaysBeforeCloseHelp: "settings.fields.billReminderDaysBeforeCloseHelp",
    billReminderDaysBeforeDue: "settings.fields.billReminderDaysBeforeDue",
    billReminderDaysBeforeDueHelp: "settings.fields.billReminderDaysBeforeDueHelp",
    budgetOverspendAlerts: "settings.fields.budgetOverspendAlerts",
    
    // Backup
    backupNow: "settings.fields.backupNow",
    restoreBackup: "settings.fields.restoreBackup",
    autoBackup: "settings.fields.autoBackup",
    autoBackupFrequency: "settings.fields.autoBackupFrequency",
    autoBackupFrequencyDaily: "settings.fields.autoBackupFrequencyDaily",
    autoBackupFrequencyWeekly: "settings.fields.autoBackupFrequencyWeekly",
    backupFolder: "settings.fields.backupFolder",
    lastBackup: "settings.fields.lastBackup",
    notConfigured: "settings.fields.notConfigured",
    folderSelectionSoon: "settings.fields.folderSelectionSoon",
    restoreWarning: "settings.fields.restoreWarning",
    restoreConfirm: "settings.fields.restoreConfirm",
    
    // Diagnostics
    version: "settings.fields.version",
    dbPath: "settings.fields.dbPath",
    viewLogs: "settings.fields.viewLogs",
    repairDb: "settings.fields.repairDb",
    resetSettings: "settings.fields.resetSettings",
  },
  
  placeholders: {
    decimalExample: "settings.placeholders.decimalExample",
  },
  
  notes: {
    notifications: "settings.notes.notifications",
    repairDb: "settings.notes.repairDb",
    resetSettings: "settings.notes.resetSettings",
  },
  
  backup: {
    infoTitle: "settings.backup.infoTitle",
    infoLine1: "settings.backup.infoLine1",
    infoLine2: "settings.backup.infoLine2",
    infoLine3: "settings.backup.infoLine3",
    includesTitle: "settings.backup.includesTitle",
    includesAccounts: "settings.backup.includesAccounts",
    includesTransactions: "settings.backup.includesTransactions",
    includesCategories: "settings.backup.includesCategories",
    includesSettings: "settings.backup.includesSettings",
  },
  
  messages: {
    loading: "settings.messages.loading",
    errorLoading: "settings.messages.errorLoading",
    saved: "settings.messages.saved",
    errorSaving: "settings.messages.errorSaving",
    backupCreated: "settings.messages.backupCreated",
    backupError: "settings.messages.backupError",
    backupDownloaded: "settings.messages.backupDownloaded",
    backupDownloadError: "settings.messages.backupDownloadError",
    backupInvalid: "settings.messages.backupInvalid",
    backupRestored: "settings.messages.backupRestored",
    backupRestoreError: "settings.messages.backupRestoreError",
    repairCompleted: "settings.messages.repairCompleted",
    repairCompletedWithErrors: "settings.messages.repairCompletedWithErrors",
    repairNoIssues: "settings.messages.repairNoIssues",
    repairError: "settings.messages.repairError",
    resetCompleted: "settings.messages.resetCompleted",
    resetError: "settings.messages.resetError",
    resetConfirmTitle: "settings.messages.resetConfirmTitle",
    resetConfirmMessage: "settings.messages.resetConfirmMessage",
    reset: "settings.messages.reset",
  },
} as const;

