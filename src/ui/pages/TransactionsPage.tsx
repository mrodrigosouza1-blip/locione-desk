import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { transactionRepository } from "../../infra/repositories/transactionRepository";
import { accountRepository } from "../../infra/repositories/accountRepository";
import { creditCardRepository } from "../../infra/repositories/creditCardRepository";
import { categoryRepository } from "../../infra/repositories/categoryRepository";
import { formatDateString } from "../../utils/format";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import MoneyDisplay from "../components/MoneyDisplay";
import { parseMoneyInput, formatMoneyInput, cleanMoneyInput } from "../utils/moneyInput";
import { getDatabase } from "../../infra/database";
import Topbar, { type TopbarPeriod } from "../components/Topbar";
import Modal from "../components/Modal";
import DatePicker from "../components/DatePicker";
import TransactionTypeSelectorModal from "../components/TransactionTypeSelectorModal";
import { useI18n } from "../../i18n/I18nProvider";
import { TPK } from "../../i18n/keys/transactionsPageKeys";
import { AK } from "../../i18n/keys/appKeys";
import { AKC } from "../../i18n/keys/accountsKeys";
import { CCDK } from "../../i18n/keys/creditCardDetailKeys";
import { Plus } from "lucide-react";
import { requireGate } from "../../services/requireGate";
import { getUsageCounters } from "../../services/usageCounters";
import { useToast } from "../hooks/useToast";
import { logger } from "../../utils/logger";
import EmptyState from "../../shared/components/EmptyState";
import { illustrations } from "../../assets/illustrations";

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<TopbarPeriod>("month");
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

  // Estados dos modais
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Estados para dados
  const [accounts, setAccounts] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Formulário de transação de conta
  const [accountFormData, setAccountFormData] = useState({
    account_id: 0,
    type: "expense" as "income" | "expense" | "transfer",
    amount_cents: "" as number | string,
    date: new Date().toISOString().split("T")[0],
    competence_month: new Date().toISOString().slice(0, 7),
    description: "",
    category_id: 1,
  });

  // Formulário de transação de cartão
  const [cardFormData, setCardFormData] = useState({
    credit_card_id: 0,
    amount_cents: "" as number | string,
    date: new Date().toISOString().split("T")[0],
    competence_month: new Date().toISOString().slice(0, 7),
    description: "",
    installments: 1,
    category_id: 1,
  });

  useEffect(() => {
    loadTransactions();
    loadAccounts();
    loadCreditCards();
    loadCategories();
  }, []);

  async function loadTransactions() {
    const trans = await transactionRepository.findAll();
    setTransactions(trans);
  }

  async function loadAccounts() {
    const accs = await accountRepository.findAll();
    setAccounts(accs);
    if (accs.length > 0 && accountFormData.account_id === 0) {
      setAccountFormData({ ...accountFormData, account_id: accs[0].id });
    }
  }

  async function loadCreditCards() {
    const cards = await creditCardRepository.findAll();
    setCreditCards(cards);
    if (cards.length > 0 && cardFormData.credit_card_id === 0) {
      setCardFormData({ ...cardFormData, credit_card_id: cards[0].id });
    }
  }

  async function loadCategories() {
    try {
      const cats = await categoryRepository.findAll();
      setCategories(cats);
    } catch (error) {
      logger.errorTag("TransactionsPage", "Erro ao carregar categorias:", error);
      // Continuar com array vazio para não travar a tela
      setCategories([]);
    }
  }

  // Carregar categorias ordenadas (Sem categoria primeiro, depois alfabético)
  const getSortedCategories = () => {
    const db = getDatabase();
    const cats = db.categories ?? [];
    const semCategoria = cats.find((c: any) => c.id === 1 || c.name === "Sem categoria");
    const outras = cats.filter((c: any) => c.id !== 1 && c.name !== "Sem categoria");
    outras.sort((a: any, b: any) => a.name.localeCompare(b.name));
    return semCategoria ? [semCategoria, ...outras] : outras;
  };

  async function handleNewTransaction() {
    logger.debugTag("TransactionsPage", "Novo Lançamento click");

    // Verificar gate do plano FREE (limite total)
    const counters = getUsageCounters();
    if (!requireGate("transactions.create", counters, toast, navigate, t)) {
      return;
    }

    // Verificar se há contas ou cartões disponíveis
    if (accounts.length === 0 && creditCards.length === 0) {
      toast.error("Crie uma conta ou cartão primeiro para adicionar lançamentos.");
      return;
    }

    setIsSelectorOpen(true);
  }

  function handleSelectorSelect(type: "account" | "card") {
    setIsSelectorOpen(false);

    if (type === "account") {
      if (accounts.length === 0) {
        toast.error("Crie uma conta primeiro para adicionar lançamentos.");
        return;
      }

      // Verificar gate específico para transações de conta
      const counters = getUsageCounters();
      if (!requireGate("transactions.create.account", counters, toast, navigate, t)) {
        return;
      }

      setIsAccountModalOpen(true);
    } else if (type === "card") {
      if (creditCards.length === 0) {
        toast.error("Crie um cartão primeiro para adicionar lançamentos.");
        return;
      }

      // Verificar gate específico para transações de cartão
      const counters = getUsageCounters();
      if (!requireGate("transactions.create.card", counters, toast, navigate, t)) {
        return;
      }

      setIsCardModalOpen(true);
    }
  }

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (accountFormData.account_id === 0) {
      toast.error("Selecione uma conta.");
      return;
    }

    // Verificar gate novamente antes de criar
    const counters = getUsageCounters();
    if (!requireGate("transactions.create.account", counters, toast, navigate)) {
      return;
    }

    try {
      // Converter string para centavos no submit
      const rawAmountCents = typeof accountFormData.amount_cents === "string" 
        ? parseMoneyInput(accountFormData.amount_cents)
        : accountFormData.amount_cents;
      
      const amountCents = accountFormData.type === "income" 
        ? Math.abs(rawAmountCents) 
        : -Math.abs(rawAmountCents);
      
      await transactionRepository.create({
        ...accountFormData,
        account_id: accountFormData.account_id,
        amount_cents: amountCents,
        category_id: accountFormData.category_id || 1,
      });
      
      toast.success("Lançamento criado com sucesso");
      setIsAccountModalOpen(false);
      setAccountFormData({
        account_id: accounts.length > 0 ? accounts[0].id : 0,
        type: "expense",
        amount_cents: "",
        date: new Date().toISOString().split("T")[0],
        competence_month: new Date().toISOString().slice(0, 7),
        description: "",
        category_id: 1,
      });
      await loadTransactions();
    } catch (error) {
      logger.errorTag("TransactionsPage", "Erro ao criar transação de conta:", error);
      toast.error(t(AK.common.error) || "Erro ao criar lançamento.");
    }
  }

  async function handleCardSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (cardFormData.credit_card_id === 0) {
      toast.error("Selecione um cartão.");
      return;
    }

    try {
      const cardData = await creditCardRepository.findById(cardFormData.credit_card_id);
      if (!cardData) {
        toast.error("Cartão não encontrado.");
        return;
      }

      // Converter string para centavos no submit
      const rawAmountCents = typeof cardFormData.amount_cents === "string" 
        ? parseMoneyInput(cardFormData.amount_cents)
        : cardFormData.amount_cents;
      
      const amount = Math.abs(rawAmountCents);
      
      // Validar limite disponível
      if (cardData.limit_available_cents < amount) {
        toast.error(t(CCDK.messages.insufficientLimit) || "Limite insuficiente.");
        return;
      }

      // Verificar gate novamente antes de criar
      const counters = getUsageCounters();
      if (!requireGate("transactions.create.card", counters, toast, navigate, t)) {
        return;
      }

      await transactionRepository.create({
        type: "credit_card_charge",
        amount_cents: -amount,
        date: cardFormData.date,
        competence_month: cardFormData.competence_month,
        description: cardFormData.description,
        credit_card_id: cardFormData.credit_card_id,
        category_id: cardFormData.category_id,
        installments: cardFormData.installments > 1 ? cardFormData.installments : undefined,
      });

      toast.success("Lançamento criado com sucesso");
      setIsCardModalOpen(false);
      setCardFormData({
        credit_card_id: creditCards.length > 0 ? creditCards[0].id : 0,
        amount_cents: "",
        date: new Date().toISOString().split("T")[0],
        competence_month: new Date().toISOString().slice(0, 7),
        description: "",
        installments: 1,
        category_id: 1,
      });
      await loadTransactions();
    } catch (error) {
      logger.errorTag("TransactionsPage", "Erro ao criar transação de cartão:", error);
      toast.error(t(AK.common.error) || "Erro ao criar lançamento.");
    }
  }

  const filteredTransactions = transactions.filter((t) =>
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Topbar
        title={t(TPK.title)}
        subtitle={t(TPK.subtitle)}
        primaryAction={{
          label: t(AK.common.newTransaction),
          onClick: handleNewTransaction,
          icon: <Plus size={16} />,
          variant: "primary",
        }}
        showPeriodSelect={true}
        period={period}
        onPeriodChange={setPeriod}
        showLockNow={true}
      />
      <div className="content-area">

        <div style={{ marginBottom: "1rem" }}>
          <input
            className="input"
            type="text"
            placeholder={t(TPK.searchPlaceholder)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "400px" }}
          />
        </div>

        <div className="card">
          {!filteredTransactions || filteredTransactions.length === 0 ? (
            <EmptyState
              image={illustrations.empty.transactions}
              title={t(TPK.empty.title)}
              action={
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsSelectorOpen(true)}
                >
                  <Plus size={16} />
                  {t(AK.common.create)}
                </button>
              }
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t(TPK.table.date)}</th>
                  <th>{t(TPK.table.description)}</th>
                  <th>{t(TPK.table.type)}</th>
                  <th>{t(TPK.table.amount)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => {
                  const getTypeLabel = () => {
                    switch (transaction.type) {
                      case "income": return t(TPK.types.income);
                      case "expense": return t(TPK.types.expense);
                      case "transfer": return t(TPK.types.transfer);
                      case "card_payment": return t(TPK.types.cardPayment);
                      case "goal_deposit": return t(TPK.types.goalDeposit);
                      case "goal_withdraw": return t(TPK.types.goalWithdraw);
                      case "credit_card_charge": return t(TPK.types.creditCardCharge);
                      default: return transaction.type;
                    }
                  };
                  return (
                    <tr key={transaction.id}>
                      <td>{formatDateString(transaction.date)}</td>
                      <td>{transaction.description || "-"}</td>
                      <td>{getTypeLabel()}</td>
                      <td style={{ color: transaction.amount_cents >= 0 ? "var(--success)" : "var(--error)" }}>
                        <MoneyDisplay
                          amountCents={transaction.amount_cents}
                          currencyCode={transaction.currency_code || settings.currency}
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
      </div>

      {/* Modal Seletor */}
      <TransactionTypeSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleSelectorSelect}
      />

      {/* Modal de Transação de Conta */}
      <Modal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        title={t(AK.common.newTransaction)}
      >
        <form onSubmit={handleAccountSubmit}>
          <div className="form-group">
            <label className="label">Conta</label>
            <select
              className="input"
              value={accountFormData.account_id}
              onChange={(e) => setAccountFormData({ ...accountFormData, account_id: parseInt(e.target.value) || 0 })}
              required
            >
              <option value={0}>Selecione uma conta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">{t(AKC.transactionFields.type)}</label>
            <select
              className="input"
              value={accountFormData.type}
              onChange={(e) => setAccountFormData({ ...accountFormData, type: e.target.value as any })}
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
              value={typeof accountFormData.amount_cents === "string" ? accountFormData.amount_cents : formatMoneyInput(accountFormData.amount_cents)}
              onChange={(e) => {
                const cleaned = cleanMoneyInput(e.target.value);
                setAccountFormData({ ...accountFormData, amount_cents: cleaned });
              }}
              placeholder="0"
              required
            />
          </div>
          <DatePicker
            label={t(AKC.transactionFields.date)}
            value={accountFormData.date}
            onChange={(date) => {
              setAccountFormData({
                ...accountFormData,
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
              value={accountFormData.competence_month}
              onChange={(e) => setAccountFormData({ ...accountFormData, competence_month: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">{t(AKC.transactionFields.description)}</label>
            <input
              className="input"
              type="text"
              value={accountFormData.description}
              onChange={(e) => setAccountFormData({ ...accountFormData, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="label">{t(AKC.transactionFields.category)}</label>
            <select
              className="input"
              value={accountFormData.category_id || 1}
              onChange={(e) => setAccountFormData({ ...accountFormData, category_id: parseInt(e.target.value) || 1 })}
            >
              {getSortedCategories().map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAccountModalOpen(false)}>
              {t(AK.common.cancel)}
            </button>
            <button type="submit" className="btn btn-primary">
              {t(AK.common.save)}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Transação de Cartão */}
      <Modal 
        isOpen={isCardModalOpen} 
        onClose={() => setIsCardModalOpen(false)} 
        title={t(CCDK.modals.newPurchase.title)}
      >
        <form onSubmit={handleCardSubmit}>
          <div className="form-group">
            <label className="label">Cartão</label>
            <select
              className="input"
              value={cardFormData.credit_card_id}
              onChange={(e) => setCardFormData({ ...cardFormData, credit_card_id: parseInt(e.target.value) || 0 })}
              required
            >
              <option value={0}>Selecione um cartão</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">{t(CCDK.modals.newPurchase.fields.amount)} ({settings.currency})</label>
            <input
              className="input"
              type="text"
              inputMode="decimal"
              value={typeof cardFormData.amount_cents === "string" ? cardFormData.amount_cents : formatMoneyInput(cardFormData.amount_cents)}
              onChange={(e) => {
                const cleaned = cleanMoneyInput(e.target.value);
                setCardFormData({ ...cardFormData, amount_cents: cleaned });
              }}
              placeholder="0"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">{t(CCDK.modals.newPurchase.fields.installments)}</label>
            <input
              className="input"
              type="number"
              min="1"
              value={cardFormData.installments}
              onChange={(e) => setCardFormData({ ...cardFormData, installments: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          <DatePicker
            label={t(CCDK.modals.newPurchase.fields.date)}
            value={cardFormData.date}
            onChange={(date) => {
              setCardFormData({
                ...cardFormData,
                date,
                competence_month: date.slice(0, 7),
              });
            }}
            required
          />
          <div className="form-group">
            <label className="label">{t(CCDK.modals.newPurchase.fields.competenceMonth)}</label>
            <input
              className="input"
              type="month"
              value={cardFormData.competence_month}
              onChange={(e) => setCardFormData({ ...cardFormData, competence_month: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">{t(CCDK.modals.newPurchase.fields.category)}</label>
            <select
              className="input"
              value={cardFormData.category_id}
              onChange={(e) => setCardFormData({ ...cardFormData, category_id: parseInt(e.target.value) || 1 })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">{t(CCDK.modals.newPurchase.fields.description)}</label>
            <input
              className="input"
              type="text"
              value={cardFormData.description}
              onChange={(e) => setCardFormData({ ...cardFormData, description: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCardModalOpen(false)}>
              {t(AK.common.cancel)}
            </button>
            <button type="submit" className="btn btn-primary">
              {t(AK.common.save)}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
