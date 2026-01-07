import { useI18n } from "../../i18n/I18nProvider";
import { RK } from "../../i18n/keys/reportsKeys";

interface MovementFilterToggleProps {
  value: "all" | "income" | "expense";
  onChange: (value: "all" | "income" | "expense") => void;
  disabled?: boolean;
}

export default function MovementFilterToggle({
  value,
  onChange,
  disabled = false,
}: MovementFilterToggleProps) {
  const { t } = useI18n();
  const options = [
    { value: "all" as const, label: t(RK.movementFilterAll) },
    { value: "income" as const, label: t(RK.movementFilterIncome) },
    { value: "expense" as const, label: t(RK.movementFilterExpense) },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.25rem",
        backgroundColor: "var(--bg-secondary)",
        borderRadius: "8px",
        border: "1px solid var(--border)",
      }}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "6px",
              backgroundColor: isSelected ? "var(--accent-primary)" : "transparent",
              color: isSelected ? "white" : "var(--text-primary)",
              fontSize: "0.875rem",
              fontWeight: isSelected ? 600 : 400,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

