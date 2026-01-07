// Dicionários de tradução simples (sem libs pesadas)

export type Locale = "pt-BR" | "it-IT" | "en-US";

export interface Translations {
  // Settings
  settings: string;
  preferences: string;
  security: string;
  alerts: string;
  backup: string;
  diagnostics: string;
  advancedPreferences: string;
  language: string;
  decimals: string;
  weekStartsOn: string;
  monday: string;
  mondayRecommended: string;
  sunday: string;
  auto: string;
  
  // Security
  enablePin: string;
  changePin: string;
  setPin: string;
  lockOnMinimize: string;
  autoLockMinutes: string;
  privacyMode: string;
  confirmBeforeDelete: string;
  
  // AppGate
  unlockApp: string;
  enterPin: string;
  incorrectPin: string;
}

const translations: Record<Locale, Translations> = {
  "pt-BR": {
    settings: "Configurações",
    preferences: "Preferências",
    security: "Segurança",
    alerts: "Alertas",
    backup: "Backup e Restauração",
    diagnostics: "Diagnóstico",
    advancedPreferences: "Preferências Avançadas",
    language: "Idioma",
    decimals: "Casas Decimais",
    weekStartsOn: "Semana Começa Em",
    monday: "Segunda",
    mondayRecommended: "Segunda (recomendado)",
    sunday: "Domingo",
    auto: "Automático",
    enablePin: "Habilitar PIN",
    changePin: "Alterar PIN",
    setPin: "Definir PIN",
    lockOnMinimize: "Bloquear ao Minimizar",
    autoLockMinutes: "Bloquear Após (minutos de inatividade)",
    privacyMode: "Modo Privacidade",
    confirmBeforeDelete: "Confirmar Antes de Excluir",
    unlockApp: "Desbloquear Aplicativo",
    enterPin: "Digite seu PIN para continuar",
    incorrectPin: "PIN incorreto",
  },
  "it-IT": {
    settings: "Impostazioni",
    preferences: "Preferenze",
    security: "Sicurezza",
    alerts: "Avvisi",
    backup: "Backup e Ripristino",
    diagnostics: "Diagnostica",
    advancedPreferences: "Preferenze Avanzate",
    language: "Lingua",
    decimals: "Decimali",
    weekStartsOn: "Settimana Inizia Il",
    monday: "Lunedì",
    mondayRecommended: "Lunedì (consigliato)",
    sunday: "Domenica",
    auto: "Automatico",
    enablePin: "Abilita PIN",
    changePin: "Cambia PIN",
    setPin: "Imposta PIN",
    lockOnMinimize: "Blocca al Minimizzare",
    autoLockMinutes: "Blocca Dopo (minuti di inattività)",
    privacyMode: "Modalità Privacy",
    confirmBeforeDelete: "Conferma Prima di Eliminare",
    unlockApp: "Sblocca Applicazione",
    enterPin: "Inserisci il tuo PIN per continuare",
    incorrectPin: "PIN errato",
  },
  "en-US": {
    settings: "Settings",
    preferences: "Preferences",
    security: "Security",
    alerts: "Alerts",
    backup: "Backup & Restore",
    diagnostics: "Diagnostics",
    advancedPreferences: "Advanced Preferences",
    language: "Language",
    decimals: "Decimals",
    weekStartsOn: "Week Starts On",
    monday: "Monday",
    mondayRecommended: "Monday (recommended)",
    sunday: "Sunday",
    auto: "Auto",
    enablePin: "Enable PIN",
    changePin: "Change PIN",
    setPin: "Set PIN",
    lockOnMinimize: "Lock on Minimize",
    autoLockMinutes: "Lock After (minutes of inactivity)",
    privacyMode: "Privacy Mode",
    confirmBeforeDelete: "Confirm Before Delete",
    unlockApp: "Unlock Application",
    enterPin: "Enter your PIN to continue",
    incorrectPin: "Incorrect PIN",
  },
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations["pt-BR"];
}

export function t(locale: Locale, key: keyof Translations): string {
  const dict = getTranslations(locale);
  return dict[key] || key;
}

