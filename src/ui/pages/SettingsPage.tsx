import { useEffect, useState } from "react";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import type { Settings } from "../../domain/settings";
import Topbar from "../components/Topbar";
import PreferencesSection from "./settings/sections/PreferencesSection";
import SecuritySection from "./settings/sections/SecuritySection";
import AlertsSection from "./settings/sections/AlertsSection";
import BackupSection from "./settings/sections/BackupSection";
import PrivacySection from "./settings/sections/PrivacySection";
import DiagnosticsSection from "./settings/sections/DiagnosticsSection";
import { useI18n } from "../../i18n/I18nProvider";
import { SK } from "./settings/settingsKeys";
import { logger } from "../../utils/logger";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const { t } = useI18n();
  const toastGlobal = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function loadSettings() {
    try {
      const s = settingsRepository.getSettings();
      setSettings(s);
      
      // Aplicar tema
      if (s.preferences.theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else if (s.preferences.theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        // system: usar preferência do sistema
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
      }
    } catch (error) {
      logger.errorTag("SettingsPage", "Erro ao carregar configurações:", error);
      showToast(t(SK.messages.errorLoading), "error");
      toastGlobal.error(t(SK.messages.errorLoading));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(partial: Partial<Settings>) {
    if (!settings) return;
    
    setSaving(true);
    try {
      await settingsRepository.updateSettings(partial);
      const updated = settingsRepository.getSettings();
      setSettings(updated);
      
      // Aplicar tema se mudou
      if (partial.preferences?.theme) {
        const theme = partial.preferences.theme;
        if (theme === "dark") {
          document.documentElement.setAttribute("data-theme", "dark");
        } else if (theme === "light") {
          document.documentElement.setAttribute("data-theme", "light");
        } else {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
        }
      }
      
      showToast(t(SK.messages.saved));
    } catch (error) {
      logger.errorTag("SettingsPage", "Erro ao atualizar configurações:", error);
      showToast(t(SK.messages.errorSaving), "error");
      toastGlobal.error(t(SK.messages.errorSaving));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Topbar
          title={t(SK.title)}
          showLockNow={true}
        />
        <div className="content-area">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <div>{t(SK.messages.loading)}</div>
          </div>
        </div>
      </>
    );
  }

  if (!settings) {
    return (
      <>
        <Topbar
          title={t(SK.title)}
          showLockNow={true}
        />
        <div className="content-area">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <div>{t(SK.messages.errorLoading)}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={t(SK.title)}
        subtitle={t(SK.subtitle)}
        showLockNow={true}
      />
      <div className="content-area">

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <PreferencesSection 
            settings={settings} 
            onUpdate={handleUpdate} 
            saving={saving}
            toast={toastGlobal}
            navigate={navigate}
          />
          
          <SecuritySection 
            settings={settings} 
            onUpdate={handleUpdate} 
            saving={saving}
            toast={toastGlobal}
            navigate={navigate}
          />
          
          <AlertsSection 
            settings={settings} 
            onUpdate={handleUpdate} 
            saving={saving}
            toast={toastGlobal}
            navigate={navigate}
          />
          
          <BackupSection
            settings={settings}
            onUpdate={handleUpdate}
            saving={saving}
            onToast={showToast}
          />
          
          <PrivacySection />
          
          <DiagnosticsSection
            settings={settings}
            onUpdate={handleUpdate}
            onToast={showToast}
          />
          
          {/* Seção de Licença */}
          <div className="card">
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
              {t("about.license.title") || "Plano e Licença"}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              {t("about.license.settingsDescription") || "Gerencie seu plano e licença do aplicativo."}
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/license")}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-start" }}
            >
              {t("about.license.manageLicense") || "Gerenciar Licença"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            padding: "1rem 1.5rem",
            backgroundColor: toast.type === "success" ? "var(--success)" : "var(--error)",
            color: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 10000,
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* CSS para animação do toast */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
