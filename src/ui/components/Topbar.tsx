import React, { useState, useRef, useEffect } from "react";
import { Lock, MoreVertical } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import { TX } from "../../i18n/keys/transactionsKeys";
import { isDesktop } from "../../platform/isDesktop";
import { useAppGate } from "./AppGate";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { getPlanLabel, shouldShowPremiumBadge } from "../../services/licenseGate";
import BrandLogo from "../../shared/components/BrandLogo";

export type TopbarPeriod =
  | "last7Days"
  | "last15Days"
  | "last30Days"
  | "month"
  | "custom";

export interface TopbarAction {
  label: string | React.ReactNode; // já traduzido (t(...)) ou ReactNode
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  title?: string; // tooltip
}

export interface TopbarMenuItem {
  label: string | React.ReactNode; // já traduzido ou ReactNode
  onClick: () => void;
  disabled?: boolean;
  title?: string; // tooltip
}

export interface TopbarProps {
  title?: string | React.ReactNode; // t(...) ou ReactNode (opcional)
  subtitle?: string; // opcional, t(...)
  subtitleRight?: string; // opcional, texto à direita (ex: data/hora)
  primaryAction?: TopbarAction; // CTA
  secondaryAction?: TopbarAction; // opcional
  menuItems?: TopbarMenuItem[]; // ⋯
  showPeriodSelect?: boolean; // só Transações/Relatórios
  period?: TopbarPeriod; // controlado pela página
  onPeriodChange?: (p: TopbarPeriod) => void;
  showLockNow?: boolean; // mostrar 🔒
  onLockNow?: () => void; // dispara lock imediato
  badge?: string; // badge de plano (ex: "Premium Anual")
}

export default function Topbar({
  title,
  subtitle,
  subtitleRight,
  primaryAction,
  secondaryAction,
  menuItems = [],
  showPeriodSelect = false,
  period,
  onPeriodChange,
  showLockNow = false,
  onLockNow,
  badge,
}: TopbarProps) {
  const { t } = useI18n();
  const { lockNow: appGateLockNow } = useAppGate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Verificar estado premium para badge
  const premiumBadge = shouldShowPremiumBadge() ? getPlanLabel() : undefined;

  // Verificar se PIN está habilitado
  const shouldShowLock = showLockNow && (() => {
    try {
      const settings = settingsRepository.getSettings();
      return settings.security.pinEnabled;
    } catch {
      return false;
    }
  })();

  const handleLockNow = () => {
    if (onLockNow) {
      onLockNow();
    } else {
      appGateLockNow();
    }
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const handlePeriodChange = (value: string) => {
    if (onPeriodChange) {
      onPeriodChange(value as TopbarPeriod);
    }
  };

  return (
    <div
      className="topbar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "88px",
        height: "88px",
        padding: "0",
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid var(--border)",
        overflow: "visible",
      }}
    >
      {/* Zona A: Logo da marca (isolado à esquerda) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingLeft: "32px",
          paddingRight: "48px",
          flexShrink: 0,
        }}
      >
        <BrandLogo variant="horizontal" size="xl" />
      </div>

      {/* Zona B: Título da página e badge (centro) */}
      <div
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "0.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {title && (
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                margin: 0,
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
              aria-label={typeof title === "string" ? title : "LociOne Desk"}
            >
              {title}
            </h1>
          )}
          {(badge || premiumBadge) && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                background: "var(--accent-primary)",
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              ✨ {badge || premiumBadge}
            </span>
          )}
        </div>
        {(subtitle || subtitleRight) && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {subtitle && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
            {subtitleRight && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {subtitleRight}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Zona C: Ações (botões à direita) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          paddingRight: "1.5rem",
          flexShrink: 0,
        }}
      >
        {/* Seletor de Período */}
        {showPeriodSelect && period !== undefined && onPeriodChange && (
          <select
            className="input"
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            style={{
              minWidth: "150px",
              fontSize: "0.875rem",
            }}
          >
            <option value="last7Days">{t(TX.period.last7Days)}</option>
            <option value="last15Days">{t(TX.period.last15Days)}</option>
            <option value="last30Days">{t(TX.period.last30Days)}</option>
            <option value="month">{t(TX.period.month)}</option>
            <option value="custom">{t(TX.period.custom)}</option>
          </select>
        )}

        {/* Botão Lock Now (🔒) */}
        {shouldShowLock && isDesktop() && (
          <button
            className="btn btn-secondary"
            onClick={handleLockNow}
            title={t(AK.common.lockNow)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
            }}
          >
            <Lock size={16} />
            <span style={{ fontSize: "0.875rem" }}>{t(AK.common.lockNow)}</span>
          </button>
        )}

        {/* Botão Secundário */}
        {secondaryAction && (
          <button
            className={`btn ${secondaryAction.variant === "primary" ? "btn-primary" : "btn-secondary"}`}
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {secondaryAction.icon}
            <span>{secondaryAction.label}</span>
          </button>
        )}

        {/* Botão Principal (CTA) */}
        {primaryAction && (
          <button
            className={`btn ${primaryAction.variant === "secondary" ? "btn-secondary" : "btn-primary"}`}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            title={primaryAction.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {primaryAction.icon}
            <span>{primaryAction.label}</span>
          </button>
        )}

        {/* Menu "⋯" */}
        {menuItems.length > 0 && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setMenuOpen(!menuOpen)}
              title={t(AK.common.moreActions)}
              style={{
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "0.5rem",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  minWidth: "180px",
                  zIndex: 1000,
                  overflow: "hidden",
                }}
              >
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setMenuOpen(false);
                    }}
                    disabled={item.disabled}
                    title={item.title}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      backgroundColor: "transparent",
                      border: "none",
                      color: item.disabled ? "var(--text-disabled)" : "var(--text-primary)",
                      cursor: item.disabled ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!item.disabled) {
                        e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
