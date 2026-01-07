interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="form-group">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <label className="label" style={{ marginBottom: description ? "0.25rem" : 0 }}>
            {label}
          </label>
          {description && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          style={{
            width: "48px",
            height: "28px",
            borderRadius: "14px",
            border: "none",
            background: checked ? "var(--accent-primary)" : "var(--border)",
            cursor: disabled ? "not-allowed" : "pointer",
            position: "relative",
            transition: "background 0.2s",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "white",
              position: "absolute",
              top: "2px",
              left: checked ? "22px" : "2px",
              transition: "left 0.2s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          />
        </button>
      </div>
    </div>
  );
}

