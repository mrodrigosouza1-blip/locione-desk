import { useState, useEffect } from "react";
import type { Settings } from "../../../../domain/settings";
import Toggle from "../../../components/Toggle";
import PinSetupModal from "../modals/PinSetupModal";
import PinVerifyModal from "../modals/PinVerifyModal";
import { useI18n } from "../../../../i18n/I18nProvider";
import { Lock, Key } from "lucide-react";
import { SK } from "../settingsKeys";
import { AK } from "../../../../i18n/keys/appKeys";
import { getUsageCounters } from "../../../../services/usageCounters";
import { checkGate } from "../../../../services/planGate";
import { requireGate } from "../../../../services/requireGate";
import { isPro } from "../../../../services/licenseService";

interface SecuritySectionProps {
  settings: Settings;
  onUpdate: (partial: Partial<Settings>) => Promise<void>;
  saving?: boolean;
  toast?: { success: (msg: string) => void; error: (msg: string) => void };
  navigate?: (path: string) => void;
}

export default function SecuritySection({
  settings,
  onUpdate,
  saving = false,
  toast,
  navigate,
}: SecuritySectionProps) {
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);
  const [isPinVerifyOpen, setIsPinVerifyOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [verifyMode, setVerifyMode] = useState<"reactivate" | "change" | null>(null);
  const [pendingToggleState, setPendingToggleState] = useState<boolean | null>(null);
  const { t } = useI18n();

  const hasPin = !!settings.security.pinHash;
  const pinEnabled = settings.security.pinEnabled;
  const isPremium = isPro();

  // PIN Básico (FREE): permite apenas 4 dígitos numéricos para bloquear abertura do app
  // PIN Premium: recursos avançados (timeout, lockOnMinimize, etc.)
  
  // Verificar se pode usar recursos premium do PIN
  const canUsePremiumPin = (() => {
    if (toast && navigate) {
      const counters = getUsageCounters();
      const result = checkGate("premium.pin", counters);
      return result.ok;
    } else {
      return isPremium;
    }
  })();

  async function handleToggle(key: keyof Settings["security"], value: boolean | number) {
    // Bloquear recursos premium se não pode usar PIN premium
    if ((key === "lockOnMinimize" || key === "autoLockMinutes") && value === true) {
      if (!canUsePremiumPin) {
        // Tentar ativar recurso premium sem PIN premium
        if (toast && navigate) {
          const counters = getUsageCounters();
          requireGate("premium.pin", counters, toast, navigate, t);
        }
        // Não salvar - retornar sem fazer nada
        return;
      }
    }
    
    await onUpdate({
      security: {
        ...settings.security,
        [key]: value,
      },
    });
  }

  // Sanitizar: se recursos premium estão ativos mas não pode usar PIN premium, desativar
  useEffect(() => {
    if (!canUsePremiumPin) {
      const needsUpdate: Partial<Settings["security"]> = {};
      if (settings.security.lockOnMinimize) {
        needsUpdate.lockOnMinimize = false;
      }
      if (settings.security.autoLockMinutes > 0) {
        needsUpdate.autoLockMinutes = 0;
      }
      if (Object.keys(needsUpdate).length > 0) {
        onUpdate({
          security: {
            ...settings.security,
            ...needsUpdate,
          },
        }).catch(() => {
          // Ignorar erros de atualização
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUsePremiumPin, settings.security.lockOnMinimize, settings.security.autoLockMinutes]);

  // Criar novo PIN (primeira vez ou alterar)
  async function handlePinSetup(pinHash: string) {
    await onUpdate({
      security: {
        ...settings.security,
        pinEnabled: true,
        pinHash,
      },
    });
  }

  // Desabilitar PIN (preserva pinHash)
  async function handleDisablePin() {
    await onUpdate({
      security: {
        ...settings.security,
        pinEnabled: false,
        // NÃO apagar pinHash - apenas desabilitar
      },
    });
  }

  // Reativar PIN existente (após verificação)
  async function handleReactivatePin() {
    await onUpdate({
      security: {
        ...settings.security,
        pinEnabled: true,
        // pinHash já existe, não modificar
      },
    });
  }

  // Alterar PIN (verifica atual, depois cria novo)
  async function handleChangePin(newPinHash: string) {
    await onUpdate({
      security: {
        ...settings.security,
        pinEnabled: true, // Garantir que está habilitado após alterar
        pinHash: newPinHash,
      },
    });
  }

  // Handler do toggle "Habilitar PIN"
  function handlePinToggle(checked: boolean) {
    if (checked) {
      // PIN Básico (FREE): permite ativar sem verificar gate
      // Apenas recursos premium (lockOnMinimize, autoLockMinutes) exigem gate
      // Se não for premium, ainda pode ativar PIN básico (4 dígitos)
      
      // Ativar PIN (básico ou premium)
      if (hasPin) {
        // PIN já existe: pedir confirmação (reativar, não recriar)
        setPendingToggleState(true);
        setVerifyMode("reactivate");
        setIsPinVerifyOpen(true);
      } else {
        // Criar novo PIN (só se não existir hash)
        // FREE: permite criar PIN básico (4 dígitos)
        setPendingToggleState(true);
        setIsPinSetupOpen(true);
      }
    } else {
      // Desativar PIN (preserva pinHash)
      if (window.confirm(t(SK.fields.disablePinConfirm))) {
        handleDisablePin();
      }
    }
  }

  // Após verificar PIN (modo reativação ou alteração)
  function handleVerifySuccess() {
    setIsPinVerifyOpen(false);
    if (verifyMode === "reactivate") {
      handleReactivatePin();
      setPendingToggleState(null);
    } else if (verifyMode === "change") {
      setIsChangePinOpen(true);
    }
    setVerifyMode(null);
  }

  // Cancelar verificação
  function handleVerifyCancel() {
    setIsPinVerifyOpen(false);
    setVerifyMode(null);
    setPendingToggleState(null);
    // Toggle volta para OFF automaticamente (não salvamos nada)
  }

  // Cancelar criação de PIN
  function handlePinSetupCancel() {
    setIsPinSetupOpen(false);
    setIsChangePinOpen(false);
    setPendingToggleState(null);
    setVerifyMode(null);
    // Toggle volta para OFF automaticamente (não salvamos nada)
  }

  // Após criar novo PIN (primeira vez)
  async function handlePinSetupConfirm(pinHash: string) {
    setIsPinSetupOpen(false);
    await handlePinSetup(pinHash);
    setPendingToggleState(null);
  }

  // Após criar novo PIN (alteração)
  async function handleChangePinConfirm(newPinHash: string) {
    setIsChangePinOpen(false);
    await handleChangePin(newPinHash);
  }

  // Handler do botão "Alterar PIN"
  function handleChangePinClick() {
    setVerifyMode("change");
    setIsPinVerifyOpen(true);
  }

  return (
    <div className="card" style={{ maxWidth: "600px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <Lock size={24} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(SK.sections.security)}</h2>
      </div>

      <Toggle
        label={t(SK.fields.enablePin)}
        description={t(SK.fields.enablePinHelp)}
        checked={pendingToggleState !== null ? pendingToggleState : pinEnabled}
        onChange={handlePinToggle}
        disabled={saving}
      />

      {/* Botão "Alterar PIN" - aparece se existe pinHash (mesmo se desabilitado) */}
      {hasPin && (
        <div style={{ marginBottom: "1rem" }}>
          <button
            className="btn btn-secondary"
            onClick={handleChangePinClick}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            disabled={saving}
          >
            <Key size={16} />
            {t(SK.fields.changePin)}
          </button>
        </div>
      )}

      <Toggle
        label={t(SK.fields.lockOnMinimize)}
        description={
          canUsePremiumPin 
            ? t(SK.fields.lockOnMinimizeHelp)
            : `${t(SK.fields.lockOnMinimizeHelp)} (${t("gate.pin.message")})`
        }
        checked={canUsePremiumPin ? settings.security.lockOnMinimize : false}
        onChange={(checked) => handleToggle("lockOnMinimize", checked)}
        disabled={saving || !canUsePremiumPin}
      />

      <div className="form-group">
        <label className="label">{t(SK.fields.autoLockMinutes)}</label>
        <select
          className="input"
          value={settings.security.autoLockMinutes}
          onChange={(e) => handleToggle("autoLockMinutes", parseInt(e.target.value) as 0 | 1 | 2 | 5 | 10 | 30)}
          disabled={saving || !settings.security.pinEnabled || !canUsePremiumPin}
        >
          <option value={0}>{t(AK.common.no)}</option>
          <option value={1}>{t(SK.fields.autoLockMinutesValue, { n: 1 })}</option>
          <option value={2}>{t(SK.fields.autoLockMinutesValuePlural, { n: 2 })}</option>
          <option value={5}>{t(SK.fields.autoLockMinutesValuePlural, { n: 5 })}</option>
          <option value={10}>{t(SK.fields.autoLockMinutesValuePlural, { n: 10 })}</option>
          <option value={30}>{t(SK.fields.autoLockMinutesValuePlural, { n: 30 })}</option>
        </select>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          {settings.security.autoLockMinutes === 0
            ? t(SK.fields.autoLockDisabled)
            : t(SK.fields.autoLockEnabled, { n: settings.security.autoLockMinutes })}
        </p>
      </div>

      <Toggle
        label={t(SK.fields.privacyMode)}
        description={t(SK.fields.privacyModeHelp)}
        checked={settings.security.privacyMode}
        onChange={(checked) => handleToggle("privacyMode", checked)}
        disabled={saving}
      />

      <Toggle
        label={t(SK.fields.confirmDelete)}
        description={t(SK.fields.confirmDeleteHelp)}
        checked={settings.security.confirmBeforeDelete}
        onChange={(checked) => handleToggle("confirmBeforeDelete", checked)}
        disabled={saving}
      />

      {/* Modal de verificação (reativação ou alteração) */}
      {hasPin && settings.security.pinHash && (
        <PinVerifyModal
          isOpen={isPinVerifyOpen}
          pinHash={settings.security.pinHash}
          onVerify={handleVerifySuccess}
          onCancel={handleVerifyCancel}
        />
      )}

      {/* Modal de criação (primeira vez ou alteração) */}
      <PinSetupModal
        isOpen={isPinSetupOpen || isChangePinOpen}
        onClose={handlePinSetupCancel}
        onConfirm={isChangePinOpen ? handleChangePinConfirm : handlePinSetupConfirm}
        isChanging={isChangePinOpen}
      />
    </div>
  );
}
