import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import Topbar from "../components/Topbar";

interface ProFeaturePageProps {
  featureName: string;
  description?: string;
}

export default function ProFeaturePage({ featureName, description }: ProFeaturePageProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <>
      <Topbar
        title={featureName}
        subtitle={description || t("gate.generic.message")}
      />
      <div className="content-area">
        <div className="card" style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center" }}>
          <Lock size={64} style={{ margin: "0 auto 1.5rem", color: "var(--text-secondary)" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
            {featureName}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "1rem", whiteSpace: "pre-line" }}>
            {description || t("gate.generic.message")}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/license")}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            {t(AK.nav.plan) || "Ver planos"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

