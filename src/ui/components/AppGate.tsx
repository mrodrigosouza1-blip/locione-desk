import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import type { Settings } from "../../domain/settings";
import PinVerifyModal from "../pages/settings/modals/PinVerifyModal";
import { logger } from "../../utils/logger";
import { isSafeModeActive } from "../../utils/bootSafety";

interface AppGateContextValue {
  lockNow: () => void;
  isLocked: boolean;
}

const AppGateContext = createContext<AppGateContextValue | undefined>(undefined);

export function useAppGate(): AppGateContextValue {
  const context = useContext(AppGateContext);
  if (!context) {
    // Fallback: retornar função vazia se não estiver dentro do provider
    return {
      lockNow: () => {},
      isLocked: false,
    };
  }
  return context;
}

interface AppGateProps {
  children: ReactNode;
  safeMode?: boolean;
}

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

export default function AppGate({ children, safeMode: safeModeProp }: AppGateProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  // Verificar safe mode (pode vir de prop ou verificar diretamente)
  const safeMode = safeModeProp ?? isSafeModeActive();

  function lockNow() {
    const currentSettings = settingsRepository.getSettings();
    if (currentSettings.security.pinEnabled) {
      setIsLocked(true);
    }
  }

  useEffect(() => {
    loadSettings();

    // Escutar eventos IPC do Electron para lock on minimize
    let electronAPI: any = null;
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      electronAPI = (window as any).electronAPI;
      
      // Escutar evento de lock do Electron (minimize/blur)
      if (electronAPI.onAppLock) {
        electronAPI.onAppLock(() => {
          const currentSettings = settingsRepository.getSettings();
          const isSafe = isSafeModeActive();
          if (currentSettings.security.pinEnabled && !isSafe) {
            logger.debugTag("APPGATE", "Lock requested via IPC");
            setIsLocked(true);
          }
        });
      }
    }
    
    // Fallback: escutar blur/focus do window (para web ou fallback)
    const handleBlur = () => {
      const currentSettings = settingsRepository.getSettings();
      const isSafe = isSafeModeActive();
      if (currentSettings.security.pinEnabled && currentSettings.security.lockOnMinimize && !isSafe) {
        // Só usar blur se não tiver IPC do Electron (web mode)
        if (!electronAPI) {
          setIsLocked(true);
        }
      }
    };

    const handleFocus = () => {
      // Quando a janela ganha foco, não desbloqueia automaticamente
      // O usuário precisa inserir o PIN
    };

    // Escutar eventos de inatividade (mousemove, keydown)
    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      const currentSettings = settingsRepository.getSettings();
      const isSafe = isSafeModeActive();
      if (currentSettings.security.pinEnabled && currentSettings.security.autoLockMinutes > 0 && !isSafe) {
        const minutes = currentSettings.security.autoLockMinutes;
        inactivityTimer = setTimeout(() => {
          setIsLocked(true);
        }, minutes * 60 * 1000);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);

    // Iniciar timer de inatividade
    resetInactivityTimer();

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      window.removeEventListener("click", resetInactivityTimer);
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, []);

  function loadSettings() {
    try {
      const s = settingsRepository.getSettings();
      setSettings(s);
      
      // Se PIN está habilitado E não está em safe mode, bloquear na inicialização
      if (s.security.pinEnabled && s.security.pinHash && !safeMode) {
        setIsLocked(true);
      } else if (safeMode) {
        // Em safe mode, nunca bloquear
        setIsLocked(false);
      }
    } catch (error) {
      logger.errorTag("AppGate", "Erro ao carregar settings no AppGate:", error);
      // Se não conseguir carregar, permitir acesso (fallback)
      setSettings(null);
    }
  }

  async function handleVerify() {
    setIsLocked(false);
    
    // Resetar timer de inatividade após desbloquear
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    const currentSettings = settingsRepository.getSettings();
    if (currentSettings.security.pinEnabled && currentSettings.security.autoLockMinutes > 0) {
      const minutes = currentSettings.security.autoLockMinutes;
      inactivityTimer = setTimeout(() => {
        setIsLocked(true);
      }, minutes * 60 * 1000);
    }
  }

  const contextValue: AppGateContextValue = {
    lockNow,
    isLocked,
  };

  // Se não tem settings carregado ou PIN não habilitado ou está em safe mode, mostrar children
  if (!settings || !settings.security.pinEnabled || !settings.security.pinHash || safeMode) {
    return (
      <AppGateContext.Provider value={contextValue}>
        {children}
      </AppGateContext.Provider>
    );
  }

  // Se está bloqueado, mostrar modal de PIN (não acontece em safe mode)
  if (isLocked) {
    return (
      <AppGateContext.Provider value={contextValue}>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--bg-primary)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PinVerifyModal
            isOpen={true}
            pinHash={settings.security.pinHash}
            onVerify={handleVerify}
          />
        </div>
        {/* Não renderizar children quando bloqueado */}
        <div style={{ visibility: "hidden", height: "100vh", overflow: "hidden" }}>{children}</div>
      </AppGateContext.Provider>
    );
  }

  // Desbloqueado: mostrar children normalmente
  return (
    <AppGateContext.Provider value={contextValue}>
      {children}
    </AppGateContext.Provider>
  );
}

