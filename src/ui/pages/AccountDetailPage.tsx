import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { accountRepository } from "../../infra/repositories/accountRepository";
import { transactionRepository } from "../../infra/repositories/transactionRepository";
import { formatDateString } from "../../utils/format";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import MoneyDisplay from "../components/MoneyDisplay";
import { parseMoneyInput, formatMoneyInput, cleanMoneyInput } from "../utils/moneyInput";
import { getDatabase, getOrCreateMetaVaultAccount } from "../../infra/database";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import DatePicker from "../components/DatePicker";
import { ArrowLeft, Plus } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import { AKC } from "../../i18n/keys/accountsKeys";
import { ADK } from "../../i18n/keys/accountDetailKeys";
import { requireGate } from "../../services/requireGate";
import { getUsageCounters } from "../../services/usageCounters";
import { useToast } from "../hooks/useToast";
import { getTxTypeLabel } from "../formatters/transactionTypeLabel";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balanceWithGoals, setBalanceWithGoals] = useState<number | null>(null);
  const [balanceWithoutGoals, setBalanceWithoutGoals] = useState<number | null>(null);
  const [goalsTotalCents, setGoalsTotalCents] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    type: "income" | "expense" | "transfer";
    amount_cents: number | string;
    date: string;
    competence_month: string;
    description: string;
    category_id: number;
  }>({
    type: "expense",
    amount_cents: "",
    date: new Date().toISOString().split("T")[0],
    competence_month: new Date().toISOString().slice(0, 7),
    description: "",
    category_id: 1,
  });
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

  // Carregar categorias ordenadas (Sem categoria primeiro, depois alfabético)
  const getSortedCategories = () => {
    const db = getDatabase();
    const categories = db.categories ?? [];
    const semCategoria = categories.find((c: any) => c.id === 1 || c.name === "Sem categoria");
    const outras = categories.filter((c: any) => c.id !== 1 && c.name !== "Sem categoria");
    outras.sort((a: any, b: any) => a.name.localeCompare(b.name));
    return semCategoria ? [semCategoria, ...outras] : outras;
  };

  useEffect(() => {
    if (id) {
      loadAccount();
      loadTransactions();
    }
  }, [id]);

  async function loadAccount() {
    if (!id) return;
    const acc = await accountRepository.findById(parseInt(id));
    if (acc) {
      const balance = await accountRepository.getBalance(acc.id);
      
      // Verificar se esta conta é um cofre de metas
      const isMetaVault = acc.is_system === true && acc.name.startsWith("Cofre Metas");
      
      if (isMetaVault) {
        // Para cofre de metas: mostrar apenas o saldo do próprio cofre
        setAccount({
          ...acc,
          balance,
        });
        setBalanceWithGoals(null); // Não mostrar "Saldo com metas"
        setBalanceWithoutGoals(null); // Não mostrar "Saldo sem metas"
        setGoalsTotalCents(balance); // Saldo total das metas = saldo do próprio cofre
      } else {
        // Para contas normais: calcular saldo da conta "Cofre Metas" da mesma moeda
        const currency = acc.currency_code || settings.currency;
        const vaultAccount = await getOrCreateMetaVaultAccount(currency);
        const vaultBalance = await accountRepository.getBalance(vaultAccount.id);
        
        // Saldo sem metas = saldo normal da conta atual (já inclui as saídas para o cofre)
        // Saldo total das metas = saldo da conta "Cofre Metas"
        // Saldo com metas = saldo conta atual + saldo cofre metas
        const balanceWithGoalsValue = balance + vaultBalance;
        
        setAccount({
          ...acc,
          balance,
        });
        setBalanceWithGoals(balanceWithGoalsValue);
        setBalanceWithoutGoals(balance); // Saldo sem metas = saldo normal (já reduzido)
        setGoalsTotalCents(vaultBalance); // Saldo total das metas = saldo do cofre
      }
    }
  }

  async function loadTransactions() {
    if (!id) return;
    const trans = await transactionRepository.findAll({ accountId: parseInt(id) });
    setTransactions(trans);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    
    // Aplicar gate para transações de conta
    const counters = getUsageCounters();
    if (!requireGate("transactions.create.account", counters, toast, navigate, t)) {
      return;
    }
    
    // Converter string para centavos no submit
    const rawAmountCents = typeof formData.amount_cents === "string" 
      ? parseMoneyInput(formData.amount_cents)
      : formData.amount_cents;
    
    const amountCents = formData.type === "income" 
      ? Math.abs(rawAmountCents) 
      : -Math.abs(rawAmountCents);
    
    await transactionRepository.create({
      ...formData,
      account_id: parseInt(id),
      amount_cents: amountCents,
      category_id: formData.category_id || 1,
    });
    
    setIsModalOpen(false);
    setFormData({
      type: "expense",
      amount_cents: "",
      date: new Date().toISOString().split("T")[0],
      competence_month: new Date().toISOString().slice(0, 7),
      description: "",
      category_id: 1,
    });
    await loadAccount();
    await loadTransactions();
  }

  if (!account) {
    return (
      <>
        <Topbar />
        <div className="content-area">
          <div>{t(ADK.notFound)}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar />
      <div className="content-area">
        <div className="page-header">
          <button className="btn btn-secondary mb-1rem" onClick={() => navigate("/accounts")}>
            <ArrowLeft size={16} />
            {t(ADK.back)}
          </button>
          <h1 className="page-title">{account.name}</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {(() => {
              // Verificar se esta conta é um cofre de metas
              const isMetaVault = account.is_system === true && account.name.startsWith("Cofre Metas");
              
              if (isMetaVault) {
                // Para cofre de metas: mostrar apenas "Saldo total das metas"
                return (
                  <p className="page-subtitle">
                    {t(ADK.balances.totalGoals)}:{" "}
                    <MoneyDisplay
                      amountCents={goalsTotalCents}
                      currencyCode={account.currency_code || settings.currency}
                      settings={fullSettings}
                      primaryStyle={{ display: "inline" }}
                      secondaryStyle={{ display: "inline", marginLeft: "0.25rem" }}
                    />
                  </p>
                );
              } else {
                // Para contas normais: mostrar os 3 campos
                return (
                  <>
                    <p className="page-subtitle">
                      {t(ADK.balances.withoutGoals)}:{" "}
                      <MoneyDisplay
                        amountCents={balanceWithoutGoals ?? account.balance}
                        currencyCode={account.currency_code || settings.currency}
                        settings={fullSettings}
                        primaryStyle={{ display: "inline" }}
                        secondaryStyle={{ display: "inline", marginLeft: "0.25rem" }}
                      />
                    </p>
                    {balanceWithGoals !== null && (
                      <>
                        <p className="page-subtitle" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                          {t(ADK.balances.totalGoals)}:{" "}
                          <MoneyDisplay
                            amountCents={goalsTotalCents}
                            currencyCode={account.currency_code || settings.currency}
                            settings={fullSettings}
                            primaryStyle={{ display: "inline" }}
                            secondaryStyle={{ display: "inline", marginLeft: "0.25rem" }}
                          />
                        </p>
                        <p className="page-subtitle" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                          {t(ADK.balances.withGoals)}:{" "}
                          <MoneyDisplay
                            amountCents={balanceWithGoals}
                            currencyCode={account.currency_code || settings.currency}
                            settings={fullSettings}
                            primaryStyle={{ display: "inline" }}
                            secondaryStyle={{ display: "inline", marginLeft: "0.25rem" }}
                          />
                        </p>
                      </>
                    )}
                  </>
                );
              }
            })()}
          </div>
        </div>

        <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            {t(ADK.newTransaction)}
          </button>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>{t(ADK.transactions)}</h2>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <p>{t(ADK.empty.title)}</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t(ADK.table.date)}</th>
                  <th>{t(ADK.table.description)}</th>
                  <th>{t(ADK.table.category)}</th>
                  <th>{t(ADK.table.type)}</th>
                  <th>{t(ADK.table.amount)}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const db = getDatabase();
                  const category = db.categories?.find((c: any) => c.id === transaction.category_id);
                  const categoryName = category?.name || t(AK.common.none);
                  return (
                    <tr key={transaction.id}>
                      <td>{formatDateString(transaction.date)}</td>
                      <td>{transaction.description || "-"}</td>
                      <td>{categoryName}</td>
                      <td>{getTxTypeLabel(t, transaction.type)}</td>
                      <td style={{ color: transaction.amount_cents >= 0 ? "var(--success)" : "var(--error)" }}>
                        <MoneyDisplay
                          amountCents={transaction.amount_cents}
                          currencyCode={account.currency_code || settings.currency}
                          settings={fullSettings}
                          primaryStyle={{ display: "inline" }}
                          secondaryStyle={{ display: "inline", marginLeft: "0.25rem", fontSize: "0.7rem" }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t(AK.common.newTransaction)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">{t(AKC.transactionFields.type)}</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="income">{t(AKC.transactionTypes.income)}</option>
                <option value="expense">{t(AKC.transactionTypes.expense)}</option>
                <option value="transfer">{t(AKC.transactionTypes.transfer)}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">{t(AKC.transactionFields.amount)} ({settings.currency})</label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={typeof formData.amount_cents === "string" ? formData.amount_cents : formatMoneyInput(formData.amount_cents)}
                onChange={(e) => {
                  const cleaned = cleanMoneyInput(e.target.value);
                  setFormData({ ...formData, amount_cents: cleaned });
                }}
                placeholder="0"
                required
              />
            </div>
            <DatePicker
              label={t(AKC.transactionFields.date)}
              value={formData.date}
              onChange={(date) => {
                setFormData({
                  ...formData,
                  date,
                  competence_month: date.slice(0, 7),
                });
              }}
              required
            />
            <div className="form-group">
              <label className="label">{t(AKC.transactionFields.competenceMonth)}</label>
              <input
                className="input"
                type="month"
                value={formData.competence_month}
                onChange={(e) => setFormData({ ...formData, competence_month: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">{t(AKC.transactionFields.description)}</label>
              <input
                className="input"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">{t(AKC.transactionFields.category)}</label>
              <select
                className="input"
                value={formData.category_id || 1}
                onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) || 1 })}
              >
                {getSortedCategories().map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                {t(AK.common.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {t(AK.common.save)}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}

