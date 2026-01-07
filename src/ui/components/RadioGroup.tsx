
interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label: string;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  required,
}: RadioGroupProps) {
  return (
    <div className="form-group">
      <label className="label">
        {label}
        {required && <span style={{ color: "var(--error)" }}> *</span>}
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
        {options.map((option) => (
          <label
            key={option.value}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "0.75rem",
              border: `2px solid ${value === option.value ? "var(--accent-primary)" : "var(--border)"}`,
              borderRadius: "8px",
              background: value === option.value ? "var(--bg-secondary)" : "transparent",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              style={{ marginTop: "0.125rem" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: value === option.value ? 600 : 400 }}>
                {option.label}
              </div>
              {option.description && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {option.description}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

