import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { creditCardRepository } from "../../infra/repositories/creditCardRepository";
import { transactionRepository } from "../../infra/repositories/transactionRepository";
import { accountRepository } from "../../infra/repositories/accountRepository";
import { categoryRepository } from "../../infra/repositories/categoryRepository";
import { formatDateString, formatMoney } from "../../utils/format";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import MoneyDisplay from "../components/MoneyDisplay";
import { parseMoneyInput, formatMoneyInput, cleanMoneyInput } from "../utils/moneyInput";
import { getCurrentInvoice, getInvoiceForCycle, type InvoiceItem } from "../../domain/invoiceService";
import { addMonths, format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import DatePicker from "../components/DatePicker";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import { CCK } from "../../i18n/keys/creditCardsKeys";
import { CCDK } from "../../i18n/keys/creditCardDetailKeys";
import { useToast } from "../hooks/useToast";
import { requireGate } from "../../services/requireGate";
import { getUsageCounters } from "../../services/usageCounters";

export default function CreditCardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
  const [card, setCard] = useState<any>(null);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [selectedCycle, setSelectedCycle] = useState<string>(""); // YYYY-MM da fatura selecionada
  const [currentCycleStart, setCurrentCycleStart] = useState<string>(""); // YYYY-MM do ciclo atual
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount_cents: "" as number | string,
    date: new Date().toISOString().split("T")[0], // Data padrão: hoje
    competence_month: new Date().toISOString().slice(0, 7),
    description: "",
    installments: 1,
    category_id: 1,
  });
  const [paymentData, setPaymentData] = useState({
    amount_cents: "" as number | string,
    account_id: 0,
    date: new Date().toISOString().split("T")[0],
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

  async function loadCard() {
    if (!id) return;
    const c = await creditCardRepository.findById(parseInt(id));
    if (c) {
      // Usar função central para calcular fatura atual
      const invoice = getCurrentInvoice(parseInt(id), new Date());
      setCard(c);
      setCurrentInvoice(invoice);
      // cycleEnd é o mês da fatura (mês do fechamento)
      setSelectedCycle(invoice.cycleEnd);
      setCurrentCycleStart(invoice.cycleEnd);
    }
  }

  async function loadTransactions() {
    if (!id) return;
    // Carregar todas as transações do cartão (compras e pagamentos)
    const trans = await transactionRepository.findAll({ 
      creditCardId: parseInt(id) 
    });
    setTransactions(trans);
  }

  async function loadAccounts() {
    setAccounts(await accountRepository.findAll());
  }

  async function loadCategories() {
    setCategories(await categoryRepository.findAll());
  }

  async function loadInvoiceForCycle(cycleMonth: string) {
    if (!id || !card) return;
    const invoice = getInvoiceForCycle(parseInt(id), cycleMonth);
    setCurrentInvoice(invoice);
    setSelectedCycle(cycleMonth);
  }

  function navigateToPreviousCycle() {
    if (!selectedCycle) return;
    const date = parse(selectedCycle + "-01", "yyyy-MM-dd", new Date());
    const previousMonth = format(addMonths(date, -1), "yyyy-MM");
    loadInvoiceForCycle(previousMonth);
  }

  function navigateToNextCycle() {
    if (!selectedCycle) return;
    const date = parse(selectedCycle + "-01", "yyyy-MM-dd", new Date());
    const nextMonth = format(addMonths(date, 1), "yyyy-MM");
    loadInvoiceForCycle(nextMonth);
  }

  function navigateToCurrentCycle() {
    if (!id || !card) return;
    // Sempre usar new Date() como referenceDate para garantir data atual
    const invoice = getCurrentInvoice(parseInt(id), new Date());
    setCurrentInvoice(invoice);
    // cycleEnd é o mês da fatura (mês do fechamento)
    setSelectedCycle(invoice.cycleEnd);
    setCurrentCycleStart(invoice.cycleEnd);
  }

  useEffect(() => {
    if (id) {
      loadCard();
      loadTransactions();
      loadAccounts();
      loadCategories();
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    // Converter string para centavos no submit
    const rawAmountCents = typeof formData.amount_cents === "string" 
      ? parseMoneyInput(formData.amount_cents)
      : formData.amount_cents;
    
    const amount = Math.abs(rawAmountCents);
    const cardData = await creditCardRepository.findById(parseInt(id));
    
    if (!cardData) return;

    // Validar limite disponível
    if (cardData.limit_available_cents < amount) {
      toast.error(t(CCDK.messages.insufficientLimit));
      return;
    }

    // Aplicar gate para transações de cartão
    const counters = getUsageCounters();
    if (!requireGate("transactions.create.card", counters, toast, navigate, t)) {
      return;
    }

    await transactionRepository.create({
      type: "credit_card_charge",
      amount_cents: -amount,
      date: formData.date,
      competence_month: formData.competence_month,
      description: formData.description,
      credit_card_id: parseInt(id),
      category_id: formData.category_id,
      installments: formData.installments > 1 ? formData.installments : undefined,
    });

    setIsModalOpen(false);
    setFormData({
      amount_cents: "",
      date: new Date().toISOString().split("T")[0],
      competence_month: new Date().toISOString().slice(0, 7),
      description: "",
      installments: 1,
      category_id: 1,
    });
    await loadCard();
    await loadTransactions();
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    // Converter string para centavos no submit
    const rawPaymentAmount = typeof paymentData.amount_cents === "string" 
      ? parseMoneyInput(paymentData.amount_cents)
      : paymentData.amount_cents;
    
    const invoice = currentInvoice ? currentInvoice.invoice_total_cents : await creditCardRepository.getCurrentInvoice(parseInt(id));
    const paymentAmount = rawPaymentAmount || invoice;

    // Criar pagamento na conta vinculado ao cartão
    await transactionRepository.create({
      type: "card_payment",
      amount_cents: -paymentAmount, // Negativo na conta (saída)
      date: paymentData.date,
      competence_month: paymentData.date.slice(0, 7),
      description: `Pagamento fatura ${card?.name}`,
      account_id: paymentData.account_id,
      credit_card_id: parseInt(id), // VINCULAR PAGAMENTO AO CARTÃO
    });

    // Atualizar limite disponível
    await creditCardRepository.updateAvailableLimit(parseInt(id), paymentAmount);

    setIsPaymentModalOpen(false);
    setPaymentData({
      amount_cents: "",
      account_id: accounts[0]?.id || 0,
      date: new Date().toISOString().split("T")[0],
    });
    
    // Atualizar imediatamente: recarregar cartão, fatura e transações
    await loadCard();
    await loadTransactions();
  }

  if (!card) {
    return (
      <>
        <Topbar />
        <div className="content-area">
          <div>{t(CCDK.notFound)}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar />
      <div className="content-area">
        <div className="page-header">
          <button className="btn btn-secondary mb-1rem" onClick={() => navigate("/credit-cards")}>
            <ArrowLeft size={16} />
            {t(AK.common.back)}
          </button>
          <h1 className="page-title">{card.name}</h1>
          <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
            <div>
              <div className="page-subtitle">{t(CCK.currentInvoice)}</div>
              <MoneyDisplay
                amountCents={currentInvoice?.invoice_total_cents || 0}
                currencyCode={settings.currency}
                settings={fullSettings}
                primaryStyle={{ fontSize: "1.5rem", fontWeight: 600 }}
              />
            </div>
            <div>
              <div className="page-subtitle">{t(CCK.availableLimit)}</div>
              <MoneyDisplay
                amountCents={card.limit_available_cents}
                currencyCode={settings.currency}
                settings={fullSettings}
                primaryStyle={{ fontSize: "1.5rem", fontWeight: 600 }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "2rem", display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            {t(CCDK.newPurchase)}
          </button>
          <button className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(true)}>
            {t(CCDK.payInvoice)}
          </button>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t(CCK.invoice)}</h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                className="btn btn-secondary"
                onClick={navigateToPreviousCycle}
                style={{ padding: "0.25rem 0.5rem" }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", minWidth: "120px", textAlign: "center" }}>
                {selectedCycle ? format(parse(selectedCycle + "-01", "yyyy-MM-dd", new Date()), "MMMM/yyyy", { locale: ptBR }) : ""}
                {selectedCycle && selectedCycle === currentCycleStart && (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--accent-primary)" }}>({t(CCK.current)})</span>
                )}
              </span>
              <button
                className="btn btn-secondary"
                onClick={navigateToNextCycle}
                style={{ padding: "0.25rem 0.5rem" }}
              >
                <ChevronRight size={16} />
              </button>
              {selectedCycle && selectedCycle !== currentCycleStart && (
                <button
                  className="btn btn-secondary"
                  onClick={navigateToCurrentCycle}
                  style={{ marginLeft: "0.5rem", fontSize: "0.75rem", padding: "0.25rem 0.75rem" }}
                >
                  {t(CCK.current)}
                </button>
              )}
            </div>
          </div>
          
          {!currentInvoice || currentInvoice.items.length === 0 ? (
            <div className="empty-state">
              <p>{t(CCK.invoiceEmpty)}</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "1rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                  {t(CCK.invoiceTotal)}
                </div>
                <MoneyDisplay
                  amountCents={currentInvoice.invoice_total_cents}
                  currencyCode={settings.currency}
                  settings={fullSettings}
                  primaryStyle={{ fontSize: "1.5rem", fontWeight: 600 }}
                />
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t(CCK.tableHeaders.date)}</th>
                    <th>{t(CCK.tableHeaders.description)}</th>
                    <th>{t(CCK.tableHeaders.amount)}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoice.items.map((item: InvoiceItem) => (
                    <tr key={item.transaction_id}>
                      <td>{formatDateString(item.date)}</td>
                      <td>
                        <div>
                          {item.installment_total && item.installment_total > 1 ? (
                            <>
                              <div style={{ fontWeight: 500 }}>
                                {item.description} ({item.installment_number}/{item.installment_total})
                              </div>
                              {item.total_purchase_amount_cents && (
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                                  {t(CCDK.purchaseDetails.totalPurchase)}:{" "}
                                  <MoneyDisplay
                                    amountCents={item.total_purchase_amount_cents}
                                    currencyCode={settings.currency}
                                    settings={fullSettings}
                                    primaryStyle={{ display: "inline" }}
                                    secondaryStyle={{ display: "inline", marginLeft: "0.25rem", fontSize: "0.7rem" }}
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            item.description || "-"
                          )}
                        </div>
                      </td>
                      <td style={{ color: "var(--error)", fontWeight: 500 }}>
                        <MoneyDisplay
                          amountCents={item.amount_cents}
                          currencyCode={settings.currency}
                          settings={fullSettings}
                          primaryStyle={{ display: "inline" }}
                          secondaryStyle={{ display: "inline", marginLeft: "0.25rem", fontSize: "0.7rem" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="card" style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>{t(CCK.transactions)}</h2>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <p>{t(CCK.transactionsEmpty)}</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t(CCK.tableHeaders.date)}</th>
                  <th>{t(CCK.tableHeaders.description)}</th>
                  <th>{t(CCK.tableHeaders.type)}</th>
                  <th>{t(CCK.tableHeaders.installment)}</th>
                  <th>{t(CCK.tableHeaders.amount)}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDateString(transaction.date)}</td>
                    <td>{transaction.description || "-"}</td>
                    <td>
                      {transaction.type === "credit_card_charge" ? t(CCK.transactionTypes.purchase) : t(CCK.transactionTypes.payment)}
                    </td>
                    <td>
                      {transaction.installment_total && transaction.installment_total > 1
                        ? `${transaction.installment_number}/${transaction.installment_total}`
                        : "-"}
                    </td>
                    <td style={{ 
                      color: transaction.type === "credit_card_charge" ? "var(--error)" : "var(--success)",
                      fontWeight: 500 
                    }}>
                      <MoneyDisplay
                        amountCents={Math.abs(transaction.amount_cents)}
                        currencyCode={settings.currency}
                        settings={fullSettings}
                        primaryStyle={{ display: "inline" }}
                        secondaryStyle={{ display: "inline", marginLeft: "0.25rem", fontSize: "0.7rem" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t(CCDK.modals.newPurchase.title)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">{t(CCDK.modals.newPurchase.fields.amount)} ({settings.currency})</label>
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
            <div className="form-group">
              <label className="label">{t(CCDK.modals.newPurchase.fields.installments)}</label>
              <input
                className="input"
                type="number"
                min="1"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <DatePicker
              label={t(CCDK.modals.newPurchase.fields.date)}
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
              <label className="label">{t(CCDK.modals.newPurchase.fields.competenceMonth)}</label>
              <input
                className="input"
                type="month"
                value={formData.competence_month}
                onChange={(e) => setFormData({ ...formData, competence_month: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">{t(CCDK.modals.newPurchase.fields.category)}</label>
              <select
                className="input"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) || 1 })}
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
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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

        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={t(CCDK.modals.payInvoice.title)}>
          <form onSubmit={handlePaymentSubmit}>
            <div className="form-group">
              <label className="label">{t(CCDK.modals.payInvoice.fields.account)}</label>
              <select
                className="input"
                value={paymentData.account_id}
                onChange={(e) => setPaymentData({ ...paymentData, account_id: parseInt(e.target.value) })}
                required
              >
                <option value="">{t(CCDK.modals.payInvoice.selectAccount)}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">{t(CCDK.modals.payInvoice.fields.amount)} ({settings.currency}) - {t(CCK.paymentFields.amountPlaceholder)}</label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={typeof paymentData.amount_cents === "string" ? paymentData.amount_cents : paymentData.amount_cents ? formatMoneyInput(paymentData.amount_cents) : ""}
                onChange={(e) => {
                  const cleaned = cleanMoneyInput(e.target.value);
                  setPaymentData({ ...paymentData, amount_cents: cleaned });
                }}
                placeholder={currentInvoice ? formatMoney(currentInvoice.invoice_total_cents, settings.currency) : "0"}
              />
            </div>
            <DatePicker
              label={t(CCDK.modals.payInvoice.fields.date)}
              value={paymentData.date}
              onChange={(date) => setPaymentData({ ...paymentData, date })}
              required
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
                {t(AK.common.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {t(CCK.pay)}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}

