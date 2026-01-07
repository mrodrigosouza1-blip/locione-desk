import { useMemo } from "react";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { formatCurrency, formatDateString, formatMoney } from "../../utils/format";

/**
 * Hook para formatação padronizada usando settings
 */
export function useFormat() {
  const settings = useMemo(() => {
    try {
      return settingsRepository.getSettings();
    } catch {
      return null;
    }
  }, []);

  const money = useMemo(
    () => (cents: number, currency?: string) => {
      if (!settings) {
        return formatMoney(cents, currency || "BRL");
      }
      return formatMoney(cents, currency || settings.preferences.currencyPrimary || "BRL", settings);
    },
    [settings]
  );

  const date = useMemo(
    () => (isoString: string, formatStr?: string) => {
      if (!settings) {
        return formatDateString(isoString, formatStr || "dd/MM/yyyy");
      }
      const dateFormat = formatStr || settings.preferences.dateFormat || "dd/MM/yyyy";
      return formatDateString(isoString, dateFormat, settings);
    },
    [settings]
  );

  const currency = useMemo(
    () => (amountCents: number, currency?: string) => {
      if (!settings) {
        return formatCurrency(amountCents, { currency: currency || "BRL" });
      }
      const curr = currency || settings.preferences.currencyPrimary || "BRL";
      const decimalsMode = settings.preferences.decimalsMode || "auto";
      const decimals = decimalsMode === "auto" ? undefined : decimalsMode === "0" ? 0 : 2;
      return formatCurrency(amountCents, {
        locale: settings.preferences.locale,
        currency: curr,
        decimals,
      });
    },
    [settings]
  );

  return { money, date, currency, settings };
}

