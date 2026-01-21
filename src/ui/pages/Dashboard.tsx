import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountRepository } from "../../infra/repositories/accountRepository";
import { creditCardRepository } from "../../infra/repositories/creditCardRepository";
import { transactionRepository } from "../../infra/repositories/transactionRepository";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { formatDateString, formatMoneyWithSecondary } from "../../utils/format";
import MoneyDisplay from "../components/MoneyDisplay";
import Topbar from "../components/Topbar";
import { Wallet, CreditCard, TrendingUp, TrendingDown, Receipt, Plus, Sun, Moon, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useI18n } from "../../i18n/I18nProvider";
import { DK } from "../../i18n/keys/dashboardKeys";
import { AK } from "../../i18n/keys/appKeys";
import { logger } from "../../utils/logger";
import { getCurrentBudgetSummary } from "../../services/budgetSummary";
import { onAppEvent } from "../state/appEvents";
import { IS_DEV } from "../../utils/isDev";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<{
    hasBudget: boolean;
    spentCents: number;
    budgetCents: number;
    remainingCents: number;
    percent: number;
    isOver: boolean;
    isCritical: boolean;
  } | null>(null);
  const [period] = useState("month");
  const [settings] = useState(() => {
    try {
      return settingsRepository.get();
    } catch {
      return { currency: "BRL", date_format: "DD/MM/YYYY", theme: "light" as const };
    }
  });
  const [fullSettings] = useState(() => {
    try {
      return settingsRepository.getSettings();
    } catch {
      return null;
    }
  });
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(() => {
    try {
      const s = settingsRepository.get();
      return s.theme || "light";
    } catch {
      return "light";
    }
  });

  function hashString(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function pickVariant<T>(items: T[], seed: string): T {
    if (items.length === 1) return items[0];
    const idx = hashString(seed) % items.length;
    return items[idx];
  }

  const alerts = (() => {
    const items: Array<{ id: string; message: string; tone: "warning" | "info" | "danger" }> = [];
    const todayKey = format(new Date(), "yyyy-MM-dd");

    accounts.forEach((account) => {
      if (account?.is_system) return;
      const balance = account.balance ?? 0;
      const initial = Math.max(0, account.initial_balance_cents || 0);
      if (balance < 0) {
        items.push({
          id: `account-negative-${account.id}`,
          message: t(
            pickVariant(
              [DK.alerts.accountNegative, DK.alerts.accountNegativeAlt1, DK.alerts.accountNegativeAlt2],
              `account-negative-${account.id}-${todayKey}`
            ),
            {
            account: account.name,
            amount: formatMoneyWithSecondary(
              Math.abs(balance),
              account.currency_code || settings.currency,
              fullSettings ?? undefined
            ).primary,
          }
          ),
          tone: "danger",
        });
        return;
      }

      if (initial > 0) {
        const lowThreshold = Math.round(initial * 0.1);
        if (balance <= lowThreshold) {
          items.push({
            id: `account-low-${account.id}`,
            message: t(
              pickVariant(
                [DK.alerts.accountLow, DK.alerts.accountLowAlt1, DK.alerts.accountLowAlt2],
                `account-low-${account.id}-${todayKey}`
              ),
              {
              account: account.name,
            amount: formatMoneyWithSecondary(
              balance,
              account.currency_code || settings.currency,
              fullSettings ?? undefined
            ).primary,
            }
            ),
            tone: "warning",
          });
        }
      }
    });

    creditCards.forEach((card) => {
      const limitTotal = card.limit_cents || 0;
      if (limitTotal <= 0) return;
      const available = card.limit_available_cents || 0;
      const percent = (available / limitTotal) * 100;
      if (percent <= 20) {
        items.push({
          id: `card-limit-${card.id}`,
          message: t(
            pickVariant(
              [DK.alerts.cardLimitLow, DK.alerts.cardLimitLowAlt1, DK.alerts.cardLimitLowAlt2],
              `card-limit-${card.id}-${todayKey}`
            ),
            {
            card: card.name,
            percent: percent.toFixed(0),
            amount: formatMoneyWithSecondary(
              available,
              card.currency_code || settings.currency,
              fullSettings ?? undefined
            ).primary,
          }
          ),
          tone: percent <= 10 ? "danger" : "warning",
        });
      }
    });

    if (budgetSummary?.hasBudget) {
      if (budgetSummary.isOver) {
        items.push({
          id: "budget-over",
          message: t(
            pickVariant(
              [DK.alerts.budgetExceeded, DK.alerts.budgetExceededAlt1, DK.alerts.budgetExceededAlt2],
              `budget-over-${todayKey}`
            ),
            {
            amount: formatMoneyWithSecondary(
              Math.abs(budgetSummary.remainingCents),
              settings.currency,
              fullSettings ?? undefined
            ).primary,
          }
          ),
          tone: "danger",
        });
      } else if (budgetSummary.isCritical) {
        items.push({
          id: "budget-critical",
          message: t(
            pickVariant(
              [DK.alerts.budgetCritical, DK.alerts.budgetCriticalAlt1, DK.alerts.budgetCriticalAlt2],
              `budget-critical-${todayKey}`
            ),
            {
            percent: budgetSummary.percent.toFixed(1),
            amount: formatMoneyWithSecondary(
              budgetSummary.remainingCents,
              settings.currency,
              fullSettings ?? undefined
            ).primary,
          }
          ),
          tone: "warning",
        });
      }
    }

    return items;
  })();
  
  // Sincronizar tema com o DOM ao montar
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, []);
  
  // Formatar data/hora em pt-BR
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  function pad2(n: number): string {
    return String(n).padStart(2, "0");
  }
  function formatNowPtBr(d: Date): string {
    const day = pad2(d.getDate());
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return `${day} de ${month} de ${year} • ${hh}:${mm}`;
  }
  
  // Atualizar data/hora a cada 30 segundos
  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(formatNowPtBr(new Date()));
    };
    updateDateTime(); // Atualizar imediatamente
    const interval = setInterval(updateDateTime, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, []);
  
  // Função para alternar tema
  function toggleTheme() {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    settingsRepository.update("theme", newTheme);
  }

  useEffect(() => {
    loadData();
  }, [period]);

  // Escutar eventos de mudança de dados para atualizar automaticamente
  useEffect(() => {
    const unsubscribe = onAppEvent("data:changed", () => {
      loadData();
    });
    return unsubscribe;
  }, []);

  async function loadData() {
    try {
      const accountsList = await accountRepository.findAll();
      const cardsList = await creditCardRepository.findAll();
    
    // Calcular saldos e totais
    const accountsWithBalance = await Promise.all(accountsList.map(async (account) => {
      const balance = await accountRepository.getBalance(account.id);
      const transactions = await transactionRepository.findAll({
        accountId: account.id,
        startDate: getStartDate(),
        endDate: getEndDate(),
      });
      
      const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Math.max(0, t.amount_cents), 0);
      
      const expense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(Math.min(0, t.amount_cents)), 0);

      return { ...account, balance, income, expense };
    }));

    // Usar função central para calcular fatura atual e limite disponível
    const cardsWithInvoice = await Promise.all(cardsList.map(async (card) => {
      const invoice = await creditCardRepository.getCurrentInvoice(card.id, new Date());
      
      // Log de debug apenas em DEV
      if (IS_DEV) {
        const invoiceDetails = await creditCardRepository.getCurrentInvoiceWithItems(card.id, new Date());
        logger.debugTag("Dashboard", `Card ${card.name}:`, {
          cycle: `${invoiceDetails.cycleStart} → ${invoiceDetails.cycleEnd}`,
          invoice_total: invoiceDetails.invoice_total_cents,
          limit_total: card.limit_cents,
          limit_available: card.limit_available_cents,
        });
      }
      
      return {
        ...card,
        invoice: {
          total_cents: invoice,
        },
      };
    }));

    const recent = (await transactionRepository.findAll({
      startDate: getStartDate(),
      endDate: getEndDate(),
    })).slice(0, 5);

    // Usar helper compartilhado para garantir mesma lógica da BudgetsPage
    const summary = await getCurrentBudgetSummary();

    setAccounts(accountsWithBalance);
    setCreditCards(cardsWithInvoice);
    setRecentTransactions(recent);
    setBudgetSummary(summary);
    } catch (error) {
      logger.errorTag("Dashboard", "Erro ao carregar dados:", error);
    }
  }

  function getStartDate(): string {
    const now = new Date();
    if (period === "month") {
      return format(startOfMonth(now), "yyyy-MM-dd");
    }
    const days = parseInt(period) || 30;
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return format(date, "yyyy-MM-dd");
  }

  function getEndDate(): string {
    const now = new Date();
    if (period === "month") {
      return format(endOfMonth(now), "yyyy-MM-dd");
    }
    return format(now, "yyyy-MM-dd");
  }

  return (
    <>
      <Topbar
        title={t(DK.title)}
        subtitle={t(AK.common.thisMonth)}
        subtitleRight={currentDateTime}
        primaryAction={{
          label: t(AK.common.newTransaction),
          onClick: () => navigate("/transactions"),
          icon: <Plus size={16} />,
          variant: "primary",
        }}
        secondaryAction={{
          label: currentTheme === "light" ? "Claro" : "Escuro",
          onClick: toggleTheme,
          icon: currentTheme === "light" ? <Sun size={16} /> : <Moon size={16} />,
          variant: "secondary",
        }}
        showLockNow={true}
      />
      <div className="content-area">

        <div className="card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <AlertTriangle size={20} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{t(DK.alerts.title)}</h2>
          </div>
          {alerts.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {t(DK.alerts.empty)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: alert.tone === "danger" ? "var(--error)" : alert.tone === "warning" ? "var(--warning)" : "var(--text-primary)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-2" style={{ marginBottom: "2rem" }}>
          {accounts.map((account) => (
            <div
              key={account.id}
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/accounts/${account.id}`)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <Wallet size={24} />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{account.name}</h3>
              </div>
              <MoneyDisplay
                amountCents={account.balance}
                currencyCode={account.currency_code || settings.currency}
                settings={fullSettings}
                primaryStyle={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}
              />
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                {t(DK.totalBalance)}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-2" style={{ marginBottom: "2rem" }}>
          {creditCards.map((card) => (
            <div
              key={card.id}
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/credit-cards/${card.id}`)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <CreditCard size={24} />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{card.name}</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <MoneyDisplay
                    amountCents={card.invoice?.total_cents || 0}
                    currencyCode={card.currency_code || settings.currency}
                    settings={fullSettings}
                    primaryStyle={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}
                  />
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {t(DK.currentInvoice)}
                  </div>
                </div>
                <div>
                  <MoneyDisplay
                    amountCents={card.limit_available_cents || 0}
                    currencyCode={card.currency_code || settings.currency}
                    settings={fullSettings}
                    primaryStyle={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--text-secondary)" }}
                  />
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {t(DK.availableLimit)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-3" style={{ marginBottom: "2rem" }}>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <TrendingUp size={20} style={{ color: "var(--success)" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{t(DK.totalIncome)}</h3>
            </div>
            {(() => {
              const totalIncome = accounts.reduce((sum, acc) => sum + (acc.income || 0), 0);
              const formatted = formatMoneyWithSecondary(totalIncome, settings.currency, fullSettings || undefined);
              return (
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--success)" }}>
                    {formatted.primary}
                  </div>
                  {formatted.secondary && (
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      ≈ {formatted.secondary}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <TrendingDown size={20} style={{ color: "var(--error)" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{t(DK.totalExpense)}</h3>
            </div>
            {(() => {
              const totalExpense = accounts.reduce((sum, acc) => sum + (acc.expense || 0), 0);
              const formatted = formatMoneyWithSecondary(totalExpense, settings.currency, fullSettings || undefined);
              return (
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--error)" }}>
                    {formatted.primary}
                  </div>
                  {formatted.secondary && (
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      ≈ {formatted.secondary}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Receipt size={20} />
              <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{t(DK.recentTransactions)}</h3>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {recentTransactions.length}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(DK.recentTransactions)}</h2>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/transactions")}
              style={{ fontSize: "0.875rem" }}
            >
              {t(DK.goToTransactions)}
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              {t(DK.empty.noTransactions)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: "0.25rem" }}>
                      {tx.description || t(AK.common.none)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {formatDateString(tx.date, settings.date_format)} • {tx.category_name || t(AK.common.none)}
                    </div>
                  </div>
                  <MoneyDisplay
                    amountCents={tx.amount_cents}
                    currencyCode={tx.currency_code || settings.currency}
                    settings={fullSettings}
                    primaryStyle={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: tx.type === "income" ? "var(--success)" : "var(--error)",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(DK.budgets)}</h2>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/budgets")}
              style={{ fontSize: "0.875rem" }}
            >
              {t(AK.common.view)}
            </button>
          </div>

          {!budgetSummary || !budgetSummary.hasBudget ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              <p style={{ marginBottom: "1rem" }}>{t(DK.budgetCard.empty)}</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/budgets")}
              >
                {t(DK.budgetCard.create)}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                  {t(DK.budgetCard.title)}
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 500 }}>
                  {(() => {
                    const spent = formatMoneyWithSecondary(budgetSummary.spentCents, settings.currency, fullSettings || undefined);
                    const budget = formatMoneyWithSecondary(budgetSummary.budgetCents, settings.currency, fullSettings || undefined);
                    return (
                      <div>
                        <div>{spent.primary} / {budget.primary}</div>
                        {(spent.secondary || budget.secondary) && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                            ≈ {spent.secondary || spent.primary} / {budget.secondary || budget.primary}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {budgetSummary.remainingCents > 0 && (
                <div style={{ marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {t(DK.budgetCard.remaining)}{" "}
                  <MoneyDisplay
                    amountCents={budgetSummary.remainingCents}
                    currencyCode={settings.currency}
                    settings={fullSettings}
                    primaryStyle={{ display: "inline" }}
                    secondaryStyle={{ display: "inline", marginLeft: "0.25rem" }}
                  />
                </div>
              )}
              {budgetSummary.remainingCents < 0 && (
                <div style={{ marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--error)" }}>
                  {t(DK.budgetCard.exceeded)}{" "}
                  <MoneyDisplay
                    amountCents={Math.abs(budgetSummary.remainingCents)}
                    currencyCode={settings.currency}
                    settings={fullSettings}
                    primaryStyle={{ display: "inline" }}
                    secondaryStyle={{ display: "inline", marginLeft: "0.25rem" }}
                  />
                </div>
              )}
              
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{
                  height: "8px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(budgetSummary.percent, 100)}%`,
                    background: budgetSummary.isOver || budgetSummary.isCritical ? "var(--error)" : "var(--accent-primary)",
                    transition: "width 0.3s"
                  }} />
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {budgetSummary.percent.toFixed(1)}% {t(DK.budgetCard.used)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
