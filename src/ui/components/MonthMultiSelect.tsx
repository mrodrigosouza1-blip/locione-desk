import { useI18n } from "../../i18n/I18nProvider";
import { GK } from "../../i18n/keys/goalsKeys";

interface MonthMultiSelectProps {
  label: string;
  selectedMonths: number[];
  onChange: (months: number[]) => void;
  required?: boolean;
}

export default function MonthMultiSelect({
  label,
  selectedMonths,
  onChange,
  required,
}: MonthMultiSelectProps) {
  const { t } = useI18n();
  const MONTHS = [
    { value: 1, label: t(GK.months.january) },
    { value: 2, label: t(GK.months.february) },
    { value: 3, label: t(GK.months.march) },
    { value: 4, label: t(GK.months.april) },
    { value: 5, label: t(GK.months.may) },
    { value: 6, label: t(GK.months.june) },
    { value: 7, label: t(GK.months.july) },
    { value: 8, label: t(GK.months.august) },
    { value: 9, label: t(GK.months.september) },
    { value: 10, label: t(GK.months.october) },
    { value: 11, label: t(GK.months.november) },
    { value: 12, label: t(GK.months.december) },
  ];
  const toggleMonth = (month: number) => {
    if (selectedMonths.includes(month)) {
      onChange(selectedMonths.filter((m) => m !== month));
    } else {
      onChange([...selectedMonths, month].sort((a, b) => a - b));
    }
  };

  return (
    <div className="form-group">
      <label className="label">
        {label}
        {required && <span style={{ color: "var(--error)" }}> *</span>}
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.5rem",
          marginTop: "0.5rem",
        }}
      >
        {MONTHS.map((month) => {
          const isSelected = selectedMonths.includes(month.value);
          return (
            <button
              key={month.value}
              type="button"
              onClick={() => toggleMonth(month.value)}
              style={{
                padding: "0.75rem",
                border: `2px solid ${isSelected ? "var(--accent-primary)" : "var(--border)"}`,
                borderRadius: "8px",
                background: isSelected ? "var(--bg-secondary)" : "transparent",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? "var(--accent-primary)" : "var(--text-primary)",
                transition: "all 0.2s",
              }}
            >
              {month.label}
            </button>
          );
        })}
      </div>
      {selectedMonths.length === 0 && required && (
        <p style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.25rem" }}>
          {t(GK.monthly.selectAtLeastOne)}
        </p>
      )}
    </div>
  );
}

