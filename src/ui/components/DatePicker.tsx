interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
}

export default function DatePicker({ value, onChange, label, required }: DatePickerProps) {
  // Usar input type="date" nativo que já tem calendário
  // Valor padrão: hoje se vazio
  const today = new Date().toISOString().split("T")[0];
  const displayValue = value || today;

  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <input
        className="input"
        type="date"
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

