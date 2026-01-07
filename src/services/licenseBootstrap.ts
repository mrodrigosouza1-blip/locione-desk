/**
 * Bootstrap de licença: verifica licença armazenada na inicialização do app
 */

import { getStoredLicense, clearLicenseToken, setLicenseToken } from "./licenseStorage";
import { verifyLocioneToken } from "./license";
import { logger } from "../utils/logger";
import { updateCrlCacheIfOnline } from "./crl";
import { updateLastCheckedAt } from "./crlStorage";
import {
  refreshRevocationIfNeeded,
  loadRevocationStateFromCache,
} from "./licenseOnlineGate";
import { isOnlineModeEnabled } from "./licenseOnlineMode";

/**
 * Verifica licença armazenada na inicialização
 * Se inválida, limpa e cai para FREE
 */
export async function verifyLicenseOnStartup(): Promise<void> {
  try {
    const stored = getStoredLicense();
    
    if (!stored.token || !stored.payload) {
      // Sem licença armazenada, tudo ok (FREE)
      return;
    }

    // Verificar assinatura do token armazenado
    const result = await verifyLocioneToken(stored.token);

    if (!result.ok) {
      // Token inválido, limpar e cair para FREE
      logger.warnTag("LicenseBootstrap", `Licença inválida: ${result.reason}`);
      await clearLicenseToken();
      return;
    }

    // Token válido, atualizar status
    if (result.payload) {
      await setLicenseToken(stored.token, result.payload);
      logger.infoTag("LicenseBootstrap", `Licença válida: ${result.payload.plan}`);

      // Carregar estado de revogação do cache primeiro
      loadRevocationStateFromCache();

      // Verificar revogação online se necessário (fire-and-forget, não bloqueia)
      // Apenas se modo online estiver habilitado
      if (result.payload.plan !== "FREE" && result.payload.license_id) {
        if (!isOnlineModeEnabled()) {
          logger.debugTag("LicenseBootstrap", "Online mode disabled, skipping revocation check");
        } else {
          refreshRevocationIfNeeded(stored.token, result.payload).catch((error) => {
            // Erro silencioso - não bloquear app
            logger.debugTag("LicenseBootstrap", "Erro ao verificar revogação online:", error);
          });
        }
      }
    }
  } catch (error) {
    logger.errorTag("LicenseBootstrap", "Erro ao verificar licença na inicialização:", error);
    // Em caso de erro, limpar licença para segurança
    await clearLicenseToken();
  }
}

/**
 * Atualiza CRL no startup (fire-and-forget, não bloqueia UI)
 */
export async function updateCrlOnStartup(): Promise<void> {
  try {
    // Se modo online estiver desabilitado, não fazer nenhuma chamada de rede
    if (!isOnlineModeEnabled()) {
      logger.debugTag("LicenseBootstrap", "Online mode disabled, skipping CRL update");
      return;
    }

    // Atualizar lastCheckedAt mesmo se falhar
    await updateLastCheckedAt();

    // Tentar atualizar CRL (não bloqueia se falhar)
    const success = await updateCrlCacheIfOnline();
    if (success) {
      logger.infoTag("LicenseBootstrap", "CRL atualizada com sucesso");
    } else {
      logger.debugTag("LicenseBootstrap", "CRL não atualizada (sem internet ou erro)");
    }
  } catch (error) {
    // Erro silencioso - não bloquear app
    logger.debugTag("LicenseBootstrap", "Erro ao atualizar CRL:", error);
  }
}

