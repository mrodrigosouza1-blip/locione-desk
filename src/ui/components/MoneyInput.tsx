import React from "react";
import {
  cleanMoneyInput,
  formatMoneyInputLocalized,
  getMoneyPlaceholder,
  parseMoneyInput,
} from "../utils/moneyInput";

interface MoneyInputProps {
  label: string;
  value: number; // em centavos
  onChange: (cents: number) => void;
  currencyCode: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  locale?: string;
}

export default function MoneyInput({
  label,
  value,
  onChange,
  currencyCode,
  required,
  placeholder,
  min = 0,
  locale = "pt-BR",
}: MoneyInputProps) {
  const displayValue = formatMoneyInputLocalized(value, locale);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanMoneyInput(e.target.value);
    const cents = parseMoneyInput(cleaned);
    onChange(cents);
  };

  return (
    <div className="form-group">
      <label className="label">
        {label} ({currencyCode})
      </label>
      <input
        className="input"
        type="text"
        inputMode="decimal"
        step="0.01"
        min={min / 100}
        value={displayValue || ""}
        onChange={handleChange}
        placeholder={placeholder || getMoneyPlaceholder(currencyCode, locale)}
        required={required}
      />
    </div>
  );
}

