import { useMemo } from "react";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { getTranslations, type Locale } from "../i18n";

export function useI18n() {
  const settings = settingsRepository.getSettings();
  const locale = settings.preferences.locale || "pt-BR";
  const translations = useMemo(() => getTranslations(locale as Locale), [locale]);

  function t(key: keyof ReturnType<typeof getTranslations>): string {
    return translations[key] || key;
  }

  return {
    t,
    locale: locale as Locale,
  };
}

