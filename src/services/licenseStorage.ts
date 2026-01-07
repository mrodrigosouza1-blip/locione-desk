/**
 * Persistência offline de licenças usando settingsRepository
 */

import { settingsRepository } from "../infra/repositories/settingsRepository";
import type { LicensePayload, LicenseStatus } from "./license";
import { getLicenseStatus } from "./license";

const LICENSE_TOKEN_KEY = "license_token";
const LICENSE_PAYLOAD_KEY = "license_payload";
const LICENSE_STATUS_KEY = "license_status";

export interface StoredLicense {
  token: string | null;
  payload: LicensePayload | null;
  status: LicenseStatus | null;
}

/**
 * Salva token de licença
 */
export async function setLicenseToken(token: string, payload: LicensePayload): Promise<void> {
  const status = getLicenseStatus(payload);
  const currentSettings = settingsRepository.getSettings();
  const updatedSettings = {
    ...currentSettings,
    [LICENSE_TOKEN_KEY]: token,
    [LICENSE_PAYLOAD_KEY]: JSON.stringify(payload),
    [LICENSE_STATUS_KEY]: JSON.stringify(status),
  };
  settingsRepository.updateSettings(updatedSettings as any);
}

/**
 * Limpa token de licença (volta para FREE)
 */
export async function clearLicenseToken(): Promise<void> {
  const currentSettings = settingsRepository.getSettings();
  const updatedSettings = {
    ...currentSettings,
    [LICENSE_TOKEN_KEY]: null,
    [LICENSE_PAYLOAD_KEY]: null,
    [LICENSE_STATUS_KEY]: null,
  };
  settingsRepository.updateSettings(updatedSettings as any);
}

/**
 * Obtém licença armazenada
 */
export function getStoredLicense(): StoredLicense {
  try {
    const settings = settingsRepository.getSettings();
    const token = (settings as any)[LICENSE_TOKEN_KEY] as string | null | undefined;
    const payloadJson = (settings as any)[LICENSE_PAYLOAD_KEY] as string | null | undefined;
    const statusJson = (settings as any)[LICENSE_STATUS_KEY] as string | null | undefined;

    return {
      token: token || null,
      payload: payloadJson ? (JSON.parse(payloadJson) as LicensePayload) : null,
      status: statusJson ? (JSON.parse(statusJson) as LicenseStatus) : null,
    };
  } catch (error) {
    return {
      token: null,
      payload: null,
      status: null,
    };
  }
}

