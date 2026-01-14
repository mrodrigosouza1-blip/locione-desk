/**
 * LicenseStore - Estado global reativo de licença
 * Fonte única de verdade para plano/premium no app
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { getStoredLicense, setLicenseToken, clearLicenseToken, type StoredLicense } from "./licenseStorage";
import { getLicenseStatus } from "./license";
import type { LicensePlan, LicensePayload } from "./license";

interface LicenseStoreState {
  license: StoredLicense;
  plan: LicensePlan;
  isPremium: boolean;
  isLoading: boolean;
}

interface LicenseStoreContextValue extends LicenseStoreState {
  setLicense: (token: string, payload: LicensePayload) => Promise<void>;
  clearLicense: () => Promise<void>;
  refresh: () => void;
}

const LicenseStoreContext = createContext<LicenseStoreContextValue | null>(null);

/**
 * Provider do LicenseStore
 */
export function LicenseStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LicenseStoreState>(() => {
    // Inicializar estado lendo do storage
    try {
      const stored = getStoredLicense();
      const plan = stored.payload?.plan || "FREE";
      const isPremium = stored.status?.isPremium || false;

      console.log("[license] state initialized", { plan, isPremium });

      return {
        license: stored,
        plan,
        isPremium,
        isLoading: false,
      };
    } catch (error) {
      console.error("[license] error initializing state:", error);
      return {
        license: { token: null, payload: null, status: null },
        plan: "FREE",
        isPremium: false,
        isLoading: false,
      };
    }
  });

  // Função para atualizar estado a partir do storage
  const refresh = useCallback(() => {
    try {
      const stored = getStoredLicense();
      const plan = stored.payload?.plan || "FREE";
      const status = stored.payload ? getLicenseStatus(stored.payload) : null;
      const isPremium = status?.isPremium || false;

      console.log("[license] state updated", { plan, isPremium });

      setState({
        license: stored,
        plan,
        isPremium,
        isLoading: false,
      });
    } catch (error) {
      console.error("[license] error refreshing state:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  // Função para definir licença (salva no storage e atualiza estado)
  const setLicense = useCallback(
    async (token: string, payload: LicensePayload) => {
      try {
        await setLicenseToken(token, payload);
        const status = getLicenseStatus(payload);
        const plan = payload.plan || "FREE";
        const isPremium = status.isPremium;

        console.log("[license] activated", { plan, isPremium });

        setState({
          license: { token, payload, status },
          plan,
          isPremium,
          isLoading: false,
        });
      } catch (error) {
        console.error("[license] error setting license:", error);
        throw error;
      }
    },
    []
  );

  // Função para limpar licença
  const clearLicense = useCallback(async () => {
    try {
      await clearLicenseToken();

      console.log("[license] cleared");

      setState({
        license: { token: null, payload: null, status: null },
        plan: "FREE",
        isPremium: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("[license] error clearing license:", error);
      throw error;
    }
  }, []);

  const value: LicenseStoreContextValue = {
    ...state,
    setLicense,
    clearLicense,
    refresh,
  };

  return <LicenseStoreContext.Provider value={value}>{children}</LicenseStoreContext.Provider>;
}

/**
 * Hook para acessar o LicenseStore
 */
export function useLicenseStore(): LicenseStoreContextValue {
  const context = useContext(LicenseStoreContext);
  if (!context) {
    throw new Error("useLicenseStore must be used within LicenseStoreProvider");
  }
  return context;
}
