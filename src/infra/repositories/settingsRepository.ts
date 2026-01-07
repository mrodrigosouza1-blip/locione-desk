import { getDatabase, saveDatabaseAsync } from "../database";
import type { Settings as LegacySettings } from "../../domain/types";
import { DEFAULT_SETTINGS, type Settings as NewSettings } from "../../domain/settings";
import { normalizeLocale, normalizeCurrency } from "../../utils/format";

// Helper para migrar settings antigas para o novo formato
function migrateLegacySettings(legacy: LegacySettings): NewSettings {
  return {
    ...DEFAULT_SETTINGS,
    preferences: {
      ...DEFAULT_SETTINGS.preferences,
      currencyPrimary: legacy.currency || DEFAULT_SETTINGS.preferences.currencyPrimary,
      dateFormat: legacy.date_format === "DD/MM/YYYY" ? "DD/MM/YYYY" : legacy.date_format === "YYYY-MM-DD" ? "YYYY-MM-DD" : "DD/MM/YYYY",
      theme: legacy.theme === "dark" ? "dark" : "light",
      // Novos campos mantêm defaults (locale já validado pelo normalizeLocale)
      locale: normalizeLocale(DEFAULT_SETTINGS.preferences.locale),
      decimalsMode: DEFAULT_SETTINGS.preferences.decimalsMode,
      weekStartsOn: DEFAULT_SETTINGS.preferences.weekStartsOn,
    },
  };
}

// Helper para obter settings do banco (compatível com formato antigo e novo)
function getSettingsFromDb(): NewSettings {
  const db = getDatabase();
  
  // Se já está no formato novo
  if (db.settings && typeof db.settings === "object" && "version" in db.settings) {
    const prefs = (db.settings as any).preferences || {};
    // Limpar e validar locale/currency (migração: corrigir dados corrompidos)
    const validLocale = normalizeLocale(prefs.locale);
    const validCurrencyPrimary = normalizeCurrency(prefs.currencyPrimary);
    const validCurrencySecondary = normalizeCurrency(prefs.currencySecondary);
    
    return {
      ...DEFAULT_SETTINGS,
      ...(db.settings as Partial<NewSettings>),
      preferences: {
        ...DEFAULT_SETTINGS.preferences,
        ...prefs,
        locale: validLocale, // Garantir que locale seja válido
        currencyPrimary: validCurrencyPrimary, // Garantir que currency seja válido
        currencySecondary: validCurrencySecondary, // Garantir que currency secundária seja válida
      },
      security: {
        ...DEFAULT_SETTINGS.security,
        ...((db.settings as any).security || {}),
      },
      alerts: {
        ...DEFAULT_SETTINGS.alerts,
        ...((db.settings as any).alerts || {}),
      },
      backup: {
        ...DEFAULT_SETTINGS.backup,
        ...((db.settings as any).backup || {}),
      },
      diagnostics: {
        ...DEFAULT_SETTINGS.diagnostics,
        ...((db.settings as any).diagnostics || {}),
      },
    };
  }
  
  // Migrar formato antigo
  const legacy = db.settings as LegacySettings;
  if (legacy && (legacy.currency || legacy.date_format || legacy.theme)) {
    return migrateLegacySettings(legacy);
  }
  
  return DEFAULT_SETTINGS;
}

export const settingsRepository = {
  // Método legado (mantido para compatibilidade)
  get(): LegacySettings {
    const settings = getSettingsFromDb();
    return {
      currency: settings.preferences.currencyPrimary,
      date_format: settings.preferences.dateFormat,
      theme: settings.preferences.theme === "system" ? "light" : settings.preferences.theme,
    };
  },

  // Novo método para obter settings completas
  getSettings(): NewSettings {
    return getSettingsFromDb();
  },

  // Método legado (mantido para compatibilidade)
  async update(key: keyof LegacySettings, value: string): Promise<void> {
    const db = getDatabase();
    const current = getSettingsFromDb();
    
    if (key === "currency") {
      current.preferences.currencyPrimary = value as any;
    } else if (key === "date_format") {
      current.preferences.dateFormat = value as any;
    } else if (key === "theme") {
      current.preferences.theme = value as any;
    }
    
    db.settings = current;
    await saveDatabaseAsync();
  },

  // Método legado (mantido para compatibilidade)
  async setSettings(settings: Partial<LegacySettings>): Promise<void> {
    const db = getDatabase();
    const current = getSettingsFromDb();
    
    if (settings.currency) {
      current.preferences.currencyPrimary = settings.currency as any;
    }
    if (settings.date_format) {
      current.preferences.dateFormat = settings.date_format as any;
    }
    if (settings.theme) {
      current.preferences.theme = settings.theme as any;
    }
    
    db.settings = current as any; // Cast para any pois Database aceita ambos os formatos
    await saveDatabaseAsync();
  },

  // Novo método para atualizar settings completas
  async updateSettings(partial: Partial<NewSettings>): Promise<void> {
    const db = getDatabase();
    const current = getSettingsFromDb();
    
    const partialPrefs = (partial.preferences || {}) as any;
    // Validar locale se fornecido
    if (partialPrefs.locale) {
      partialPrefs.locale = normalizeLocale(partialPrefs.locale);
    }
    
    const updated: NewSettings = {
      ...current,
      ...partial,
      preferences: {
        ...current.preferences,
        ...partialPrefs,
      },
      security: {
        ...current.security,
        ...(partial.security || {}),
      },
      alerts: {
        ...current.alerts,
        ...(partial.alerts || {}),
      },
      backup: {
        ...current.backup,
        ...(partial.backup || {}),
      },
      diagnostics: {
        ...current.diagnostics,
        ...(partial.diagnostics || {}),
      },
    };
    
    db.settings = updated as any; // Cast para any pois Database aceita ambos os formatos
    await saveDatabaseAsync();
  },

  // Resetar para defaults
  async resetSettings(): Promise<void> {
    const db = getDatabase();
    db.settings = DEFAULT_SETTINGS as any; // Cast para any pois Database aceita ambos os formatos
    await saveDatabaseAsync();
  },

  // Métodos para backup/restore
  async clear(): Promise<void> {
    const db = getDatabase();
    db.settings = DEFAULT_SETTINGS as any; // Cast para any pois Database aceita ambos os formatos
    await saveDatabaseAsync();
  },

  async replaceAll(settings: NewSettings): Promise<void> {
    const db = getDatabase();
    db.settings = settings as any; // Cast para any pois Database aceita ambos os formatos
    await saveDatabaseAsync();
  },
};
