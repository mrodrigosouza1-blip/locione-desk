import React, { useState, useEffect } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { verifyLocioneToken } from "../../services/license";
import { setLicenseToken, clearLicenseToken, getStoredLicense } from "../../services/licenseStorage";
import { getLicenseStatus } from "../../services/license";
import { getPlan, isRevoked, getRevocationInfo } from "../../services/licenseGate";
import { updateCrlCacheIfOnline } from "../../services/crl";
import { loadCrl } from "../../services/crlStorage";
import {
  refreshRevocationIfNeeded,
  getRevocationState,
  getRevocationInfo as getOnlineRevocationInfo,
} from "../../services/licenseOnlineGate";
import {
  getOnlineModeEnabled,
  setOnlineModeEnabled as setOnlineModeEnabledStorage,
} from "../../services/licenseOnlineCache";
import Topbar from "../components/Topbar";
import { Check, X, Calendar, Infinity, Gift, Lock, RefreshCw, Copy } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { formatDateString } from "../../utils/format";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { LK } from "../../i18n/keys/licenseKeys";
import { IS_DEV } from "../../utils/isDev";
import PrivacyNoteCard from "../components/PrivacyNoteCard";
import { hasSiteUrl, LOCIONE_SITE_URL } from "../../utils/siteLinks";
import BrandLogo from "../../shared/components/BrandLogo";
import { logger } from "../../utils/logger";

export default function LicensePage() {
  const { t } = useI18n();
  const toast = useToast();
  const [tokenInput, setTokenInput] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [isRefreshingCrl, setIsRefreshingCrl] = useState(false);
  const [isRefreshingOnline, setIsRefreshingOnline] = useState(false);
  
  // Safe defaults para evitar undefined
  const [storedLicense, setStoredLicense] = useState(() => {
    try {
      return getStoredLicense();
    } catch {
      return { token: null, payload: null, status: null };
    }
  });
  
  const [crlData, setCrlData] = useState(() => {
    try {
      return loadCrl() || null;
    } catch {
      return null;
    }
  });
  
  const [onlineModeEnabled, setOnlineModeEnabled] = useState(() => {
    try {
      return getOnlineModeEnabled() ?? true;
    } catch {
      return true;
    }
  });
  
  const [onlineRevocationState, setOnlineRevocationState] = useState<"unknown" | "active" | "revoked">(() => {
    try {
      return getRevocationState() || "unknown";
    } catch {
      return "unknown";
    }
  });
  
  const [onlineRevocationInfo, setOnlineRevocationInfo] = useState(() => {
    try {
      const info = getOnlineRevocationInfo();
      return info || { revoked_at: undefined, reason: undefined, last_check_at: undefined, online_mode_enabled: undefined };
    } catch {
      return { revoked_at: undefined, reason: undefined, last_check_at: undefined, online_mode_enabled: undefined };
    }
  });
  
  const [settings] = useState(() => {
    try {
      const s = settingsRepository.get();
      return {
        currency: s?.currency || "BRL",
        date_format: s?.date_format || "DD/MM/YYYY",
        theme: s?.theme || ("light" as const),
      };
    } catch {
      return { currency: "BRL", date_format: "DD/MM/YYYY", theme: "light" as const };
    }
  });

  useEffect(() => {
    loadLicense();
  }, []);

  function loadLicense() {
    try {
      const stored = getStoredLicense();
      setStoredLicense(stored || { token: null, payload: null, status: null });
    } catch {
      setStoredLicense({ token: null, payload: null, status: null });
    }
    
    try {
      const crl = loadCrl();
      setCrlData(crl || null);
    } catch {
      setCrlData(null);
    }
    
    try {
      setOnlineModeEnabled(getOnlineModeEnabled() ?? true);
    } catch {
      setOnlineModeEnabled(true);
    }
    
    try {
      setOnlineRevocationState(getRevocationState() || "unknown");
    } catch {
      setOnlineRevocationState("unknown");
    }
    
    try {
      const info = getOnlineRevocationInfo();
      setOnlineRevocationInfo(info || { revoked_at: undefined, reason: undefined, last_check_at: undefined, online_mode_enabled: undefined });
    } catch {
      setOnlineRevocationInfo({ revoked_at: undefined, reason: undefined, last_check_at: undefined, online_mode_enabled: undefined });
    }
  }

  async function handleRefreshCrl() {
    setIsRefreshingCrl(true);
    try {
      const success = await updateCrlCacheIfOnline();
      if (success) {
        toast.success(t(LK.crlUpdated));
        loadLicense();
      } else {
        toast.error(t(LK.crlUpdateFailed));
      }
    } catch (error) {
      toast.error(t(LK.crlUpdateFailed));
    } finally {
      setIsRefreshingCrl(false);
    }
  }

  async function handleRefreshOnline() {
    if (!storedLicense.token || !storedLicense.payload) {
      toast.error("Nenhuma licença ativa para verificar");
      return;
    }

    setIsRefreshingOnline(true);
    try {
      await refreshRevocationIfNeeded(storedLicense.token, storedLicense.payload, true);
      loadLicense();
      toast.success(t(LK.onlineCheckCompleted));
    } catch (error) {
      toast.error(t(LK.onlineCheckFailed));
    } finally {
      setIsRefreshingOnline(false);
    }
  }

  async function handleToggleOnlineMode() {
    const newValue = !onlineModeEnabled;
    await setOnlineModeEnabledStorage(newValue);
    setOnlineModeEnabled(newValue);
    toast.success(newValue ? t(LK.onlineModeEnabled) : t(LK.onlineModeDisabled));
  }

  async function handleCopyToken() {
    if (!storedLicense.token) {
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(storedLicense.token);
        toast.success(t(LK.tokenCopied));
      } else {
        // Fallback para navegadores antigos
        const textArea = document.createElement("textarea");
        textArea.value = storedLicense.token;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast.success(t(LK.tokenCopied));
      }
    } catch (error) {
      toast.error(t(LK.tokenCopyFailed));
    }
  }

  async function handleActivateToken() {
    if (!tokenInput.trim()) {
      toast.error(t(LK.tokenRequired));
      return;
    }

    setIsActivating(true);
    try {
      const result = await verifyLocioneToken(tokenInput.trim());
      
      if (result.ok && result.payload) {
        await setLicenseToken(tokenInput.trim(), result.payload);
        toast.success(t(LK.activated));
        setTokenInput("");
        loadLicense();
        // Recarregar após um delay para refletir mudanças
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(result.reason || t(LK.invalidToken));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(t(LK.errorActivating) + ": " + errorMessage);
    } finally {
      setIsActivating(false);
    }
  }

  async function handleClearLicense() {
    try {
      await clearLicenseToken();
      toast.success(t(LK.deactivated));
      loadLicense();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(t(LK.errorDeactivating));
    }
  }

  function handleActivateFree() {
    // Apenas em DEV - função para teste/reset
    if (IS_DEV) {
      handleClearLicense();
    }
  }

  async function handleOpenPlansSite() {
    if (!hasSiteUrl()) {
      toast.error(t(LK.messages.openSiteFailed));
      return;
    }

    try {
      // Verificar se window.locione existe (Electron)
      if (typeof window !== "undefined" && (window as any).locione?.openExternal) {
        await (window as any).locione.openExternal(LOCIONE_SITE_URL);
      } else {
        // Fallback para ambiente web (abrir em nova aba)
        window.open(LOCIONE_SITE_URL, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.errorTag("LicensePage", "Erro ao abrir site:", errorMessage);
      toast.error(t(LK.messages.openSiteFailed));
    }
  }

  // Safe getters com fallbacks
  const plan = (() => {
    try {
      return getPlan() || "FREE";
    } catch {
      return "FREE";
    }
  })();
  
  
  const status = (() => {
    try {
      return storedLicense?.payload ? getLicenseStatus(storedLicense.payload) : null;
    } catch {
      return null;
    }
  })();
  
  const isExpired = status?.expiresAt ? status.expiresAt <= new Date() : false;
  const licenseId = storedLicense?.payload?.license_id || null;
  const isLicenseRevoked = licenseId ? (() => {
    try {
      return isRevoked(licenseId) || false;
    } catch {
      return false;
    }
  })() : false;
  
  const revocationInfo = licenseId ? (() => {
    try {
      return getRevocationInfo(licenseId) || null;
    } catch {
      return null;
    }
  })() : null;

  return (
    <React.Fragment>
      <Topbar
        title={t(LK.title)}
        subtitle={t(LK.subtitle)}
      />
      <div className="content-area">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Plano Atual */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <BrandLogo variant="icon" size="md" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>
              {t(LK.currentPlan)}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
                <div style={{ color: "var(--primary)" }}>
                  {plan === "FREE" && <Gift size={24} />}
                  {plan === "ANNUAL" && <Calendar size={24} />}
                  {plan === "LIFETIME" && <Infinity size={24} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {plan === "FREE" && t(LK.plan.free)}
                    {plan === "ANNUAL" && t(LK.plan.annual)}
                    {plan === "LIFETIME" && t(LK.plan.lifetime)}
                    {isExpired && (
                      <span style={{ marginLeft: "0.5rem", fontSize: "0.875rem", color: "var(--error)", fontWeight: 400 }}>
                        ({t(LK.expired)})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {plan === "FREE" && t(LK.planDescription.free)}
                    {plan === "ANNUAL" && t(LK.planDescription.annual)}
                    {plan === "LIFETIME" && t(LK.planDescription.lifetime)}
                  </div>
                </div>
                <div>
                  {isLicenseRevoked ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--error)" }}>
                      <X size={20} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        {t(LK.statusRevoked)}
                      </span>
                    </div>
                  ) : plan === "FREE" || (status && status.isValid && !isExpired) ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)" }}>
                      <Check size={20} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        {t(LK.active)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--error)" }}>
                      <X size={20} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        {isExpired ? t(LK.expired) : t(LK.inactive)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {storedLicense.payload && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                  {storedLicense.payload.issued_at && (
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        {t(LK.activatedAt)}:{" "}
                      </span>
                      <span style={{ color: "var(--text-primary)" }}>
                        {formatDateString(storedLicense.payload.issued_at, settings?.date_format || "DD/MM/YYYY")}
                      </span>
                    </div>
                  )}
                  {storedLicense.payload.expires_at && (
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        {t(LK.expiresAt)}:{" "}
                      </span>
                      <span style={{ color: isExpired ? "var(--error)" : "var(--text-primary)" }}>
                        {formatDateString(storedLicense.payload.expires_at, settings?.date_format || "DD/MM/YYYY")}
                      </span>
                    </div>
                  )}
                  {storedLicense.payload.license_id && (
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        {t(LK.licenseId)}:{" "}
                      </span>
                      <span style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: "0.75rem" }}>
                        {storedLicense.payload.license_id.substring(0, 8)}...
                      </span>
                    </div>
                  )}
                  {isLicenseRevoked && revocationInfo && (
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--error-light)", borderRadius: "6px", marginTop: "0.5rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--error)", marginBottom: "0.25rem" }}>
                        {t(LK.statusRevokedDetails)}
                      </div>
                      {revocationInfo?.revoked_at && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {t(LK.revokedAt)}: {formatDateString(revocationInfo.revoked_at, settings?.date_format || "DD/MM/YYYY")}
                        </div>
                      )}
                      {revocationInfo?.reason && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                          {t(LK.reason)}: {revocationInfo.reason}
                        </div>
                      )}
                    </div>
                  )}
                  {storedLicense.payload.customer_email && (
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        {t(LK.customerEmail)}:{" "}
                      </span>
                      <span style={{ color: "var(--text-primary)" }}>
                        {storedLicense.payload.customer_email}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Privacidade */}
              <div style={{ marginTop: "1.5rem" }}>
                <PrivacyNoteCard />
              </div>
              
              {storedLicense.payload && (
                <>
                  {/* Status Online */}
                  {plan !== "FREE" && (
                    <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {t(LK.onlineStatus)}
                        </h3>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={onlineModeEnabled}
                            onChange={handleToggleOnlineMode}
                            style={{ cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {t(LK.onlineModeToggle)}
                          </span>
                        </label>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        {t(LK.onlineModeDescription)}
                      </div>
                      
                      {onlineModeEnabled && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                              {t(LK.onlineStatusLabel)}:
                            </span>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                color:
                                  onlineRevocationState === "revoked"
                                    ? "var(--error)"
                                    : onlineRevocationState === "active"
                                    ? "var(--success)"
                                    : "var(--text-secondary)",
                              }}
                            >
                              {onlineRevocationState === "revoked" && t(LK.onlineStatusRevoked)}
                              {onlineRevocationState === "active" && t(LK.onlineStatusActive)}
                              {onlineRevocationState === "unknown" && t(LK.onlineStatusUnknown)}
                            </span>
                          </div>
                          
                          {onlineRevocationInfo?.last_check_at && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                              {t(LK.onlineLastCheck)}: {formatDateString(onlineRevocationInfo.last_check_at, settings?.date_format || "DD/MM/YYYY")}
                            </div>
                          )}
                          
                          {onlineRevocationState === "revoked" && onlineRevocationInfo?.revoked_at && (
                            <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "var(--error-light)", borderRadius: "6px" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--error)", marginBottom: "0.25rem" }}>
                                {t(LK.onlineRevokedDetails)}
                              </div>
                              {onlineRevocationInfo.revoked_at && (
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                  {t(LK.revokedAt)}: {formatDateString(onlineRevocationInfo.revoked_at, settings?.date_format || "DD/MM/YYYY")}
                                </div>
                              )}
                              {onlineRevocationInfo?.reason && (
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                                  {t(LK.reason)}: {onlineRevocationInfo.reason}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <button
                            className="btn btn-secondary"
                            onClick={handleRefreshOnline}
                            disabled={isRefreshingOnline || !storedLicense?.token}
                            style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                          >
                            <RefreshCw size={16} style={{ animation: isRefreshingOnline ? "spin 1s linear infinite" : undefined }} />
                            {isRefreshingOnline ? (t(LK.refreshing) || "Atualizando...") : (t(LK.onlineCheckNow) || "Checar agora")}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Ativar Licença */}
          <div className="card">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>
              {t(LK.activateLicense)}
            </h2>

            {/* Input de Token */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label" style={{ marginBottom: "0.5rem" }}>
                {t(LK.tokenLabel)}
              </label>
              <textarea
                className="input"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={t(LK.tokenPlaceholder)}
                rows={4}
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  resize: "vertical",
                }}
              />
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleActivateToken}
                  disabled={isActivating || !tokenInput.trim()}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {isActivating ? t(LK.activating) : t(LK.activate)}
                </button>
              </div>
              <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {t(LK.tokenNote)}
              </p>
            </div>

            {/* Botões de Teste - Apenas em DEV */}
            {IS_DEV && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                <div style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "8px", opacity: 0.8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    <Lock size={20} style={{ color: "var(--text-secondary)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {t(LK.freeTest)}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        {t(LK.freeTestDescription)}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={handleActivateFree}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {t(LK.activateFree)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              {plan !== "FREE" && storedLicense?.token && (
                <button
                  className="btn btn-secondary"
                  onClick={handleCopyToken}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <Copy size={16} />
                  {t(LK.copyToken) || "Copiar Token"}
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={handleRefreshCrl}
                disabled={isRefreshingCrl}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <RefreshCw size={16} style={{ animation: isRefreshingCrl ? "spin 1s linear infinite" : undefined }} />
                {isRefreshingCrl ? (t(LK.refreshing) || "Atualizando...") : (t(LK.refreshStatus) || "Atualizar Status")}
              </button>
              {plan !== "FREE" && (
                <button
                  className="btn btn-secondary"
                  onClick={handleClearLicense}
                >
                  {t(LK.clear) || "Limpar"}
                </button>
              )}
              {hasSiteUrl() && (
                <button
                  className="btn btn-secondary"
                  onClick={handleOpenPlansSite}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  {t(LK.actions.openPlansSite)}
                </button>
              )}
            </div>
            {crlData?.lastOkAt && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "var(--bg-secondary)", borderRadius: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {t(LK.crlLastUpdated)}: {formatDateString(crlData.lastOkAt, settings?.date_format || "DD/MM/YYYY")}
              </div>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
