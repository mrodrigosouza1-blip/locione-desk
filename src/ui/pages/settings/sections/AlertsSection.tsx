import type { Settings } from "../../../../domain/settings";
import Toggle from "../../../components/Toggle";
import { Bell } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nProvider";
import { SK } from "../settingsKeys";
import { getUsageCounters } from "../../../../services/usageCounters";
import { requireGate } from "../../../../services/requireGate";
import { isPro } from "../../../../services/licenseService";

interface AlertsSectionProps {
  settings: Settings;
  onUpdate: (partial: Partial<Settings>) => Promise<void>;
  saving?: boolean;
  toast?: { success: (msg: string) => void; error: (msg: string) => void };
  navigate?: (path: string) => void;
}

export default function AlertsSection({
  settings,
  onUpdate,
  saving = false,
  toast,
  navigate,
}: AlertsSectionProps) {
  const { t } = useI18n();

  async function handleToggle(key: keyof Settings["alerts"], value: boolean | number) {
    // Verificar gate premium para ativar alertas
    if (value === true && (key === "billRemindersEnabled" || key === "budgetOverspendAlerts")) {
      if (toast && navigate) {
        const counters = getUsageCounters();
        if (!requireGate("premium.alerts", counters, toast, navigate, t)) {
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
    
    await onUpdate({
      alerts: {
        ...settings.alerts,
        [key]: value,
      },
    });
  }

  return (
    <div className="card" style={{ maxWidth: "600px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <Bell size={24} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(SK.sections.alerts)}</h2>
      </div>

      <Toggle
        label={t(SK.fields.billRemindersEnabled)}
        description={t(SK.fields.billRemindersEnabledHelp)}
        checked={settings.alerts.billRemindersEnabled}
        onChange={(checked) => handleToggle("billRemindersEnabled", checked)}
        disabled={saving}
      />

      {settings.alerts.billRemindersEnabled && (
        <>
          <div className="form-group">
            <label className="label">{t(SK.fields.billReminderDaysBeforeClose)}</label>
            <input
              type="number"
              min="1"
              max="30"
              className="input"
              value={settings.alerts.billReminderDaysBeforeClose}
              onChange={(e) =>
                handleToggle("billReminderDaysBeforeClose", parseInt(e.target.value) || 3)
              }
              disabled={saving}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              {t(SK.fields.billReminderDaysBeforeCloseHelp, { days: String(settings.alerts.billReminderDaysBeforeClose) })}
            </p>
          </div>

          <div className="form-group">
            <label className="label">{t(SK.fields.billReminderDaysBeforeDue)}</label>
            <input
              type="number"
              min="1"
              max="30"
              className="input"
              value={settings.alerts.billReminderDaysBeforeDue}
              onChange={(e) =>
                handleToggle("billReminderDaysBeforeDue", parseInt(e.target.value) || 5)
              }
              disabled={saving}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              {t(SK.fields.billReminderDaysBeforeDueHelp, { days: String(settings.alerts.billReminderDaysBeforeDue) })}
            </p>
          </div>
        </>
      )}

      <Toggle
        label={t(SK.fields.budgetOverspendAlerts)}
        description={t(SK.notes.notifications)}
        checked={settings.alerts.budgetOverspendAlerts}
        onChange={(checked) => handleToggle("budgetOverspendAlerts", checked)}
        disabled={saving}
      />

      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "1rem" }}>
        {t(SK.notes.notifications)}
      </p>
    </div>
  );
}
