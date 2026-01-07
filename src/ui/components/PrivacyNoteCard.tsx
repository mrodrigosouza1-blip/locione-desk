import { useI18n } from "../../i18n/I18nProvider";
import { Shield } from "lucide-react";

/**
 * Componente reutilizável para exibir informações de privacidade
 */
export default function PrivacyNoteCard() {
  const { t } = useI18n();

  return (
    <div className="card" style={{ maxWidth: "600px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <Shield size={24} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t("privacy.title")}</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>
          {t("privacy.line1")}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>
          {t("privacy.line2")}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>
          {t("privacy.line3")}
        </p>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, fontStyle: "italic" }}>
        {t("privacy.note")}
      </p>
    </div>
  );
}

