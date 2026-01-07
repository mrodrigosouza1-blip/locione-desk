export interface SettingsPreferences {
  currencyPrimary: "BRL" | "EUR" | "USD" | string;
  currencySecondaryEnabled: boolean;
  currencySecondary: "BRL" | "EUR" | "USD" | string;
  manualFxRate: number; // Taxa de câmbio manual (ex: 5.5 para BRL->USD)
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
  theme: "light" | "dark" | "system";
  locale: "pt-BR" | "it-IT" | "en-US";
  decimalsMode: "auto" | "0" | "2";
  weekStartsOn: 1 | 0; // 1 = Segunda, 0 = Domingo
}

export interface SettingsSecurity {
  pinEnabled: boolean;
  pinHash: string | null; // Hash do PIN (nunca texto plano)
  autoLockMinutes: 0 | 1 | 2 | 5 | 10 | 30; // 0 = desabilitado
  lockOnMinimize: boolean;
  privacyMode: boolean;
  confirmBeforeDelete: boolean;
}

export interface SettingsAlerts {
  billRemindersEnabled: boolean;
  billReminderDaysBeforeClose: number; // Dias antes do fechamento
  billReminderDaysBeforeDue: number; // Dias antes do vencimento
  budgetOverspendAlerts: boolean;
}

export interface SettingsBackup {
  defaultBackupDir: string | null; // Caminho da pasta padrão
  autoBackupEnabled: boolean;
  autoBackupFrequency: "daily" | "weekly";
  lastBackupAt: string | null; // ISO string
}

export interface SettingsDiagnostics {
  logLevel: "error" | "warn" | "info" | "debug";
  [key: string]: unknown; // Permite chaves dinâmicas como "license.crl"
}

export interface Settings {
  version: number;
  preferences: SettingsPreferences;
  security: SettingsSecurity;
  alerts: SettingsAlerts;
  backup: SettingsBackup;
  diagnostics: SettingsDiagnostics;
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  preferences: {
    currencyPrimary: "BRL",
    currencySecondaryEnabled: false,
    currencySecondary: "USD",
    manualFxRate: 1.0,
    dateFormat: "DD/MM/YYYY",
    theme: "light",
    locale: "pt-BR",
    decimalsMode: "auto",
    weekStartsOn: 1, // Segunda (recomendado)
  },
  security: {
    pinEnabled: false,
    pinHash: null,
    autoLockMinutes: 0,
    lockOnMinimize: false,
    privacyMode: false,
    confirmBeforeDelete: true,
  },
  alerts: {
    billRemindersEnabled: true,
    billReminderDaysBeforeClose: 3,
    billReminderDaysBeforeDue: 5,
    budgetOverspendAlerts: true,
  },
  backup: {
    defaultBackupDir: null,
    autoBackupEnabled: false,
    autoBackupFrequency: "daily",
    lastBackupAt: null,
  },
  diagnostics: {
    logLevel: "info",
  },
};

