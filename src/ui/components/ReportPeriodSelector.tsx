import { useState, useEffect } from "react";
import { accountRepository } from "../../infra/repositories/accountRepository";
import type { ReportFilters } from "../hooks/useReportsData";
import { Calendar, Wallet, Coins, ArrowUpDown } from "lucide-react";
import MovementFilterToggle from "./MovementFilterToggle";
import PremiumTag from "./PremiumTag";
import { useI18n } from "../../i18n/I18nProvider";
import { RK } from "../../i18n/keys/reportsKeys";

interface ReportPeriodSelectorProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  isPremium?: boolean;
}

export default function ReportPeriodSelector({
  filters,
  onFiltersChange,
  isPremium = true,
}: ReportPeriodSelectorProps) {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    async function loadOptions() {
      const accountsList = await accountRepository.findAll();
      setAccounts(accountsList);
    }
    loadOptions();
  }, []);

  function handlePeriodChange(period: ReportFilters["period"]) {
    onFiltersChange({
      ...filters,
      period,
      startDate: period === "custom" ? filters.startDate : undefined,
      endDate: period === "custom" ? filters.endDate : undefined,
    });
  }

  function handleAccountChange(accountId: string) {
    onFiltersChange({
      ...filters,
      accountId: accountId === "all" ? null : parseInt(accountId),
    });
  }

  function handleCurrencyChange(currency: string) {
    onFiltersChange({
      ...filters,
      currency: currency === "auto" ? undefined : currency === "all" ? "all" : currency,
    });
  }

  function handleMovementFilterChange(filter: "all" | "income" | "expense") {
    onFiltersChange({
      ...filters,
      movementFilter: filter,
    });
  }

  // Determinar moedas disponíveis nas contas
  const availableCurrencies = Array.from(
    new Set(accounts.map((a) => a.currency_code || "BRL"))
  ).sort();

  // Se conta específica selecionada, usar moeda da conta
  const selectedAccount = filters.accountId
    ? accounts.find((a) => a.id === filters.accountId)
    : null;
  const accountCurrency = selectedAccount?.currency_code || "BRL";

  // Mostrar seletor de moeda apenas se "Todas as contas" e múltiplas moedas disponíveis
  const showCurrencySelector =
    !filters.accountId && availableCurrencies.length > 1;

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
          {t(RK.filtersTitle)}
        </h3>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
        {/* Seletor de Período */}
        <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
            <Calendar size={16} />
            {t(RK.period)}
          </label>
          <select
            className="input"
            value={filters.period}
            onChange={(e) => handlePeriodChange(e.target.value as ReportFilters["period"])}
            style={{ width: "100%" }}
          >
            <option value="current_month">{t(RK.periodCurrentMonth)}</option>
            <option value="last_month">{t(RK.periodLastMonth)}</option>
            <option value="last_3_months">{t(RK.periodLast3Months)}</option>
            <option value="last_6_months">{t(RK.periodLast6Months)}</option>
            <option value="custom">{t(RK.periodCustom)}</option>
          </select>
        </div>

        {/* Datas personalizadas */}
        {filters.period === "custom" && (
          <>
            <div style={{ flex: "1 1 150px", minWidth: "150px" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                {t(RK.periodStartDate)}
              </label>
              <input
                className="input"
                type="date"
                value={filters.startDate || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    startDate: e.target.value,
                  })
                }
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: "1 1 150px", minWidth: "150px" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                {t(RK.periodEndDate)}
              </label>
              <input
                className="input"
                type="date"
                value={filters.endDate || ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    endDate: e.target.value,
                  })
                }
                style={{ width: "100%" }}
              />
            </div>
          </>
        )}

        {/* Seletor de Conta */}
        <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
            <Wallet size={16} />
            {t(RK.account)}
          </label>
          <select
            className="input"
            value={filters.accountId || "all"}
            onChange={(e) => handleAccountChange(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="all">{t(RK.allAccounts)}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor de Moeda (apenas quando "Todas as contas" e múltiplas moedas) */}
        {showCurrencySelector && (
          <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
              <Coins size={16} />
              {t(RK.currency)}
            </label>
            <select
              className="input"
              value={filters.currency || "auto"}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="auto">{t(RK.currencyAuto)}</option>
              {availableCurrencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
              <option value="all">{t(RK.allCurrencies)}</option>
            </select>
          </div>
        )}
        {/* Mostrar moeda da conta quando conta específica selecionada */}
        {filters.accountId && (
          <div style={{ flex: "1 1 150px", minWidth: "150px", display: "flex", alignItems: "flex-end" }}>
            <div style={{ padding: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {t(RK.currency)}: <strong>{accountCurrency}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Segunda linha: Filtro de Movimento */}
      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <ArrowUpDown size={16} />
          <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            {t(RK.movementTypeLabel)}
          </label>
          {!isPremium && (
            <PremiumTag title={t("gate.reports.viewOnly")} />
          )}
        </div>
        <div style={{ maxWidth: "400px", opacity: isPremium ? 1 : 0.6 }}>
          <MovementFilterToggle
            value={filters.movementFilter || "all"}
            onChange={handleMovementFilterChange}
            disabled={!isPremium}
          />
        </div>
      </div>
    </div>
  );
}

