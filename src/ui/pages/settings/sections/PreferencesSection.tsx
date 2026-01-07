import { useState } from "react";
import type { Settings } from "../../../../domain/settings";
import Toggle from "../../../components/Toggle";
import CurrencySelect from "../../../components/CurrencySelect";
import { useI18n } from "../../../../i18n/I18nProvider";
import { Settings as SettingsIcon } from "lucide-react";
import { SK } from "../settingsKeys";
import { getUsageCounters } from "../../../../services/usageCounters";
import { requireGate } from "../../../../services/requireGate";
import { isPro } from "../../../../services/licenseService";

interface PreferencesSectionProps {
  settings: Settings;
  onUpdate: (partial: Partial<Settings>) => Promise<void>;
  saving?: boolean;
  toast?: { success: (msg: string) => void; error: (msg: string) => void };
  navigate?: (path: string) => void;
}

export default function PreferencesSection({
  settings,
  onUpdate,
  saving = false,
  toast,
  navigate,
}: PreferencesSectionProps) {
  const [localSettings, setLocalSettings] = useState(settings.preferences);
  const { t } = useI18n();

  async function handleChange<K extends keyof Settings["preferences"]>(
    key: K,
    value: Settings["preferences"][K]
  ) {
    // Verificar gate premium para moeda secundária
    if (key === "currencySecondaryEnabled" && value === true) {
      if (toast && navigate) {
        const counters = getUsageCounters();
        if (!requireGate("premium.secondary_currency", counters, toast, navigate, t)) {
          // Reverter toggle - não fazer nada
          return;
        }
      } else {
        // Fallback: verificar apenas isPro
        if (!isPro()) {
          return;
        }
      }
    }
    
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    await onUpdate({ preferences: updated });
  }

  return (
    <div className="card" style={{ maxWidth: "600px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <SettingsIcon size={24} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(SK.sections.preferences)}</h2>
      </div>

      <CurrencySelect
        label={t(SK.fields.currencyPrimary)}
        value={localSettings.currencyPrimary}
        onChange={(value) => handleChange("currencyPrimary", value)}
      />

      <Toggle
        label={t(SK.fields.currencySecondaryEnable)}
        description={t(SK.fields.currencySecondaryHelp)}
        checked={localSettings.currencySecondaryEnabled}
        onChange={(checked) => handleChange("currencySecondaryEnabled", checked)}
        disabled={saving}
      />

      {localSettings.currencySecondaryEnabled && (
        <>
          <CurrencySelect
            label={t(SK.fields.currencySecondary)}
            value={localSettings.currencySecondary}
            onChange={(value) => handleChange("currencySecondary", value)}
          />

          <div className="form-group">
            <label className="label">{t(SK.fields.manualFxRate)}</label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              className="input"
              value={localSettings.manualFxRate}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 1.0;
                handleChange("manualFxRate", value);
              }}
              placeholder={t(SK.placeholders.decimalExample)}
              disabled={saving}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              {t(SK.fields.manualFxRateHelp, {
                quote: localSettings.currencySecondary || "XXX",
                rate: String(localSettings.manualFxRate),
                base: localSettings.currencyPrimary || "XXX",
              })}
            </p>
          </div>
        </>
      )}

      <div className="form-group">
        <label className="label">{t(SK.fields.dateFormat)}</label>
        <select
          className="input"
          value={localSettings.dateFormat}
          onChange={(e) =>
            handleChange("dateFormat", e.target.value as "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY")
          }
          disabled={saving}
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>

      <div className="form-group">
        <label className="label">{t(SK.fields.theme)}</label>
        <select
          className="input"
          value={localSettings.theme}
          onChange={(e) => handleChange("theme", e.target.value as "light" | "dark" | "system")}
          disabled={saving}
        >
          <option value="light">{t(SK.fields.themeLight)}</option>
          <option value="dark">{t(SK.fields.themeDark)}</option>
          <option value="system">{t(SK.fields.themeSystem)}</option>
        </select>
      </div>

      <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.5rem" }}>
          {t(SK.sections.advanced)}
        </h3>

        <div className="form-group">
          <label className="label">{t(SK.fields.language)}</label>
          <select
            className="input"
            value={localSettings.locale}
            onChange={(e) => handleChange("locale", e.target.value as "pt-BR" | "it-IT" | "en-US")}
            disabled={saving}
          >
            <option value="pt-BR">{t("language.pt-BR")}</option>
            <option value="it-IT">{t("language.it-IT")}</option>
            <option value="en-US">{t("language.en-US")}</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label">{t(SK.fields.decimals)}</label>
          <select
            className="input"
            value={localSettings.decimalsMode}
            onChange={(e) => handleChange("decimalsMode", e.target.value as "auto" | "0" | "2")}
            disabled={saving}
          >
            <option value="auto">{t(SK.fields.decimalsAuto)}</option>
            <option value="0">{t(SK.fields.decimals0)}</option>
            <option value="2">{t(SK.fields.decimals2)}</option>
          </select>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {localSettings.decimalsMode === "auto"
              ? t(SK.fields.decimalsAutoHelp)
              : localSettings.decimalsMode === "0"
              ? t(SK.fields.decimals0Help)
              : t(SK.fields.decimals2Help)}
          </p>
        </div>

        <div className="form-group">
          <label className="label">{t(SK.fields.weekStartsOn)}</label>
          <select
            className="input"
            value={localSettings.weekStartsOn}
            onChange={(e) => handleChange("weekStartsOn", parseInt(e.target.value) as 1 | 0)}
            disabled={saving}
          >
            <option value={1}>{t(SK.fields.weekStartsOnMonday)}</option>
            <option value={0}>{t(SK.fields.weekStartsOnSunday)}</option>
          </select>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {localSettings.weekStartsOn === 1
              ? t(SK.fields.weekStartsOnMondayHelp)
              : t(SK.fields.weekStartsOnSundayHelp)}
          </p>
        </div>
      </div>
    </div>
  );
}
