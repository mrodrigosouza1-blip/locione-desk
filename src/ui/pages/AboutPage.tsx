import { useState, useEffect } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { appInfo, getDiagnosticInfo } from "../../utils/appInfo";
import { APP_NAME } from "../../config/brand";
import Topbar from "../components/Topbar";
import { Copy, Check } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { AK } from "../../i18n/keys/appKeys";
import { IS_DEV } from "../../utils/isDev";
import BrandLogo from "../../shared/components/BrandLogo";

export default function AboutPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [userDataPath, setUserDataPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("1.0.0");

  useEffect(() => {
    async function loadUserDataPath() {
      const path = await appInfo.getUserDataPath();
      setUserDataPath(path);
    }
    loadUserDataPath();
  }, []);

  useEffect(() => {
    async function loadAppVersion() {
      try {
        if (window.LociOne?.getAppVersion) {
          const version = await window.LociOne.getAppVersion();
          setAppVersion(version);
        }
      } catch (error) {
        // Fallback para "1.0.0" se der erro
        setAppVersion("1.0.0");
      }
    }
    loadAppVersion();
  }, []);

  async function handleCopyDiagnostics() {
    try {
      const diagnosticText = await getDiagnosticInfo();
      await navigator.clipboard.writeText(diagnosticText);
      setCopied(true);
      toast.success(t(AK.common.copy) + " ✓");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t(AK.common.error) || "Erro");
    }
  }

  function formatBuildDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  }

  return (
    <>
      <Topbar
        title={t("about.title") || "Sobre o App"}
        subtitle={t("about.subtitle") || "Informações do aplicativo"}
      />
      <div className="content-area">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <BrandLogo variant="horizontal" size="lg" />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
              {APP_NAME}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
              {t("about.description") || "Gerenciador financeiro pessoal offline"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                  {t("about.version") || "Versão"}
                </label>
                <div style={{ fontSize: "1rem", color: "var(--text-primary)" }}>
                  v {appVersion} Beta 1
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                  {t("about.buildDate") || "Data do Build"}
                </label>
                <div style={{ fontSize: "1rem", color: "var(--text-primary)" }}>
                  {formatBuildDate(appInfo.buildDate)}
                </div>
              </div>

              {/* Informações de debug - Apenas em DEV */}
              {IS_DEV && (
                <div>
                  <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                    {t("about.platform") || "Plataforma"}
                  </label>
                  <div style={{ fontSize: "1rem", color: "var(--text-primary)" }}>
                    {appInfo.platform}
                  </div>
                </div>
              )}

              {/* Diretório de Dados - Path completo em DEV, texto neutro em PROD */}
              <div>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                  {t("about.userDataPath") || "Diretório de Dados"}
                </label>
                {IS_DEV && userDataPath ? (
                  <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {userDataPath}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                    {t("about.userDataStoredLocally") || "Seus dados ficam armazenados neste computador."}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--text-primary)" }}>
                  {t("about.diagnostics") || "Informações de Diagnóstico"}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {t("about.diagnosticsDescription") || "Copie as informações do app para relatar problemas ou solicitar suporte."}
                </p>
              </div>
              <button
                className="btn"
                onClick={handleCopyDiagnostics}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    {t("about.copied") || "Copiado"}
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    {t("about.copyDiagnostics") || "Copiar informações"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

