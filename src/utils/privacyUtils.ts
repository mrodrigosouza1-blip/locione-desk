// Utilitários para Privacy Mode (mascarar valores)

import { formatMoney } from "./format";

export function maskValue(_value: string | number): string {
  return "•••";
}

export function formatCurrencyPrivate(
  cents: number,
  currency: string,
  privacyMode: boolean
): string {
  if (privacyMode) {
    return maskValue(cents);
  }
  return formatMoney(cents, currency);
}

export function formatMoneyPrivate(
  cents: number,
  currency: string,
  privacyMode: boolean
): string {
  return formatCurrencyPrivate(cents, currency, privacyMode);
}

