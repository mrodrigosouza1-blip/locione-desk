import React from "react";

interface MoneyInputProps {
  label: string;
  value: number; // em centavos
  onChange: (cents: number) => void;
  currencyCode: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
}

export default function MoneyInput({
  label,
  value,
  onChange,
  currencyCode,
  required,
  placeholder,
  min = 0,
}: MoneyInputProps) {
  const displayValue = value / 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value) || 0;
    const cents = Math.round(inputValue * 100);
    onChange(cents);
  };

  return (
    <div className="form-group">
      <label className="label">
        {label} ({currencyCode})
      </label>
      <input
        className="input"
        type="number"
        step="0.01"
        min={min / 100}
        value={displayValue || ""}
        onChange={handleChange}
        placeholder={placeholder || "0.00"}
        required={required}
      />
    </div>
  );
}

