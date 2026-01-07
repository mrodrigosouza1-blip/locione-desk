/**
 * Storage para CRL (Certificate Revocation List)
 * Armazena CRL verificada localmente para uso offline
 */

import { settingsRepository } from "../infra/repositories/settingsRepository";
import type { CrlPayload } from "./crl";

interface CrlStorageData {
  payload: CrlPayload;
  lastCheckedAt: string;
  lastOkAt: string;
}

const STORAGE_KEY = "license.crl";

/**
 * Salva CRL verificada no storage
 */
export async function saveCrl(payload: CrlPayload): Promise<void> {
  const now = new Date().toISOString();
  const data: CrlStorageData = {
    payload,
    lastCheckedAt: now,
    lastOkAt: now,
  };

  const settings = settingsRepository.getSettings();
  const updated = {
    ...settings,
    diagnostics: {
      ...settings.diagnostics,
      [STORAGE_KEY]: data,
    },
  };

  await settingsRepository.updateSettings(updated);
}

/**
 * Carrega CRL do storage
 * Retorna null se não existir ou estiver inválida
 */
export function loadCrl(): CrlStorageData | null {
  try {
    const settings = settingsRepository.getSettings();
    const crlData = settings.diagnostics?.[STORAGE_KEY] as CrlStorageData | undefined;

    if (!crlData || !crlData.payload) {
      return null;
    }

    // Validar estrutura básica
    if (
      typeof crlData.payload.version !== "number" ||
      typeof crlData.payload.updated_at !== "string" ||
      !Array.isArray(crlData.payload.revoked)
    ) {
      return null;
    }

    return crlData;
  } catch (error) {
    return null;
  }
}

/**
 * Atualiza apenas lastCheckedAt (sem alterar payload)
 */
export async function updateLastCheckedAt(): Promise<void> {
  const crlData = loadCrl();
  if (!crlData) {
    return;
  }

  const now = new Date().toISOString();
  const updated: CrlStorageData = {
    ...crlData,
    lastCheckedAt: now,
  };

  const settings = settingsRepository.getSettings();
  const updatedSettings = {
    ...settings,
    diagnostics: {
      ...settings.diagnostics,
      [STORAGE_KEY]: updated,
    },
  };

  await settingsRepository.updateSettings(updatedSettings);
}

/**
 * Limpa CRL do storage
 */
export async function clearCrl(): Promise<void> {
  const settings = settingsRepository.getSettings();
  const diagnostics = { ...settings.diagnostics };
  delete diagnostics[STORAGE_KEY];

  await settingsRepository.updateSettings({
    ...settings,
    diagnostics,
  });
}

