import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { settingsRepository } from "../infra/repositories/settingsRepository";
import { normalizeLocale, translate, type SupportedLocale } from "./index";

interface I18nContextValue {
  locale: SupportedLocale;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(() => {
    try {
      const settings = settingsRepository.getSettings();
      return normalizeLocale(settings.preferences.locale);
    } catch {
      return "pt-BR";
    }
  });

  useEffect(() => {
    // Observar mudanças nos settings (quando locale muda)
    const checkSettings = () => {
      try {
        const settings = settingsRepository.getSettings();
        const newLocale = normalizeLocale(settings.preferences.locale);
        if (newLocale !== locale) {
          setLocale(newLocale);
        }
      } catch {
        // Ignorar erros
      }
    };

    // Verificar a cada 500ms (polling simples - pode melhorar depois com eventos)
    const interval = setInterval(checkSettings, 500);

    return () => clearInterval(interval);
  }, [locale]);

  function t(key: string, vars?: Record<string, string | number>): string {
    return translate(key, locale, vars);
  }

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

// Helper para usar i18n fora de componentes React
export function getI18n(): I18nContextValue {
  const settings = settingsRepository.getSettings();
  const currentLocale = normalizeLocale(settings.preferences.locale);
  return {
    locale: currentLocale,
    t: (key: string, vars?: Record<string, string | number>) => translate(key, currentLocale, vars),
  };
}

