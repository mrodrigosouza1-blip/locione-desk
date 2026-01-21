import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { creditCardRepository } from "../../infra/repositories/creditCardRepository";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import MoneyDisplay from "../components/MoneyDisplay";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import ImportReceiptModal from "../components/ImportReceiptModal";
import { Plus, CreditCard, Upload, Edit, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import { CCK } from "../../i18n/keys/creditCardsKeys";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { useToast } from "../hooks/useToast";
import { requireGate } from "../../services/requireGate";
import { getUsageCounters } from "../../services/usageCounters";
import EmptyState from "../../shared/components/EmptyState";
import { illustrations } from "../../assets/illustrations";
import { cleanMoneyInput, formatMoneyInput, getMoneyPlaceholder, parseMoneyInput } from "../utils/moneyInput";

export default function CreditCardsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
  const [cards, setCards] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    limit_total_cents: 0,
    limit_available_cents: 0,
    closing_day: 1,
    due_day: 10,
    currency_code: "BRL",
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
  const locale = fullSettings?.preferences.locale ?? "pt-BR";

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    const cardsList = await creditCardRepository.findAll();
    // Usar função central para calcular fatura atual
    const cardsWithInvoice = await Promise.all(cardsList.map(async (card) => {
      const invoice = await creditCardRepository.getCurrentInvoice(card.id, new Date());
      return {
        ...card,
        invoice: {
          total_cents: invoice,
        },
      };
    }));
    setCards(cardsWithInvoice);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (editingCard) {
      // Modo edição
      await creditCardRepository.update(editingCard.id, {
        name: formData.name,
        limit_cents: formData.limit_total_cents,
        limit_available_cents: formData.limit_available_cents,
        closing_day: formData.closing_day,
        due_day: formData.due_day,
        currency_code: formData.currency_code,
      });
      toast.success(t(CCK.messages.updateSuccess) || "Cartão atualizado com sucesso");
      setIsModalOpen(false);
      setEditingCard(null);
    } else {
      // Modo criação - aplicar gate
      const counters = getUsageCounters();
      if (!requireGate("creditCards.create", counters, toast, navigate, t)) {
        return;
      }
      
      await creditCardRepository.create({
        name: formData.name,
        limit_cents: formData.limit_total_cents,
        limit_available_cents: formData.limit_available_cents,
        closing_day: formData.closing_day,
        due_day: formData.due_day,
        currency_code: formData.currency_code,
      });
      toast.success(t(CCK.messages.createSuccess) || "Cartão criado com sucesso");
      setIsModalOpen(false);
    }
    
    setFormData({
      name: "",
      limit_total_cents: 0,
      limit_available_cents: 0,
      closing_day: 1,
      due_day: 10,
      currency_code: settings.currency,
    });
    await loadCards();
  }

  function handleEdit(card: any) {
    setEditingCard(card);
    setFormData({
      name: card.name,
      limit_total_cents: card.limit_cents || 0,
      limit_available_cents: card.limit_available_cents || 0,
      closing_day: card.closing_day || 1,
      due_day: card.due_day || 10,
      currency_code: card.currency_code || settings.currency,
    });
    setIsModalOpen(true);
  }

  function handleDeleteClick(card: any) {
    setCardToDelete(card);
    setIsDeleteModalOpen(true);
  }

  async function handleDeleteConfirm(option: string) {
    if (!cardToDelete) return;
    
    setDeleting(true);
    try {
      const cascade = option === "cascade";
      await creditCardRepository.delete(cardToDelete.id, { cascade });
      toast.success(t(CCK.messages.deleteSuccess) || "Cartão excluído com sucesso");
      setIsDeleteModalOpen(false);
      setCardToDelete(null);
      
      // Se estava na página de detalhe do cartão excluído, navegar de volta
      if (window.location.pathname.includes(`/credit-cards/${cardToDelete.id}`)) {
        navigate("/credit-cards");
      }
      
      await loadCards();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(CCK.messages.deleteError);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Topbar
        title={t(CCK.title)}
        subtitle={t(CCK.subtitle)}
        primaryAction={{
          label: t(CCK.newCard),
          onClick: () => {
            const counters = getUsageCounters();
            if (!requireGate("creditCards.create", counters, toast, navigate, t)) {
              return;
            }
            setIsModalOpen(true);
          },
          icon: <Plus size={16} />,
          variant: "primary",
        }}
        secondaryAction={{
          label: t(AK.common.importReceipt),
          onClick: () => {
            const counters = getUsageCounters();
            if (!requireGate("premium.receipt_import", counters, toast, navigate, t)) {
              return;
            }
            setIsImportModalOpen(true);
          },
          icon: <Upload size={16} />,
          variant: "secondary",
        }}
        showLockNow={true}
      />
      <div className="content-area">
        {!cards || cards.length === 0 ? (
          <EmptyState
            image={illustrations.empty.accounts}
            title={t(CCK.empty.title)}
            description={t(CCK.empty.message) || undefined}
            action={
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const counters = getUsageCounters();
                  if (!requireGate("creditCards.create", counters, toast, navigate, t)) {
                    return;
                  }
                  setIsModalOpen(true);
                }}
              >
                <Plus size={16} />
                {t(CCK.empty.cta)}
              </button>
            }
          />
        ) : (
          <div className="grid grid-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="card"
                style={{ position: "relative" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <CreditCard size={24} />
                  <h3 
                    style={{ fontSize: "1.125rem", fontWeight: 600, cursor: "pointer", flex: 1 }}
                    onClick={() => navigate(`/credit-cards/${card.id}`)}
                  >
                    {card.name}
                  </h3>
                  <div style={{ display: "flex", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem", minWidth: "auto" }}
                      onClick={() => handleEdit(card)}
                      title={t(AK.common.edit)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem", minWidth: "auto", color: "var(--error)" }}
                      onClick={() => handleDeleteClick(card)}
                      title={t(AK.common.delete)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div 
                  style={{ marginBottom: "0.5rem", cursor: "pointer" }}
                  onClick={() => navigate(`/credit-cards/${card.id}`)}
                >
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                    {t(CCK.currentInvoice)}
                  </div>
                  <MoneyDisplay
                    amountCents={card.invoice?.total_cents || 0}
                    currencyCode={card.currency_code || settings.currency}
                    settings={fullSettings}
                    primaryStyle={{ fontSize: "1.25rem", fontWeight: 600 }}
                  />
                </div>
                <div 
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/credit-cards/${card.id}`)}
                >
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                    {t(CCK.availableLimit)}
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 500 }}>
                    <MoneyDisplay
                      amountCents={card.limit_available_cents}
                      currencyCode={card.currency_code || settings.currency}
                      settings={fullSettings}
                      primaryStyle={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-secondary)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setEditingCard(null);
            setFormData({
              name: "",
              limit_total_cents: 0,
              limit_available_cents: 0,
              closing_day: 1,
              due_day: 10,
              currency_code: settings.currency,
            });
          }} 
          title={editingCard ? t(CCK.editCard) : t(CCK.newCard)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">{t(CCK.fields.name)}</label>
              <input
                className="input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">{t(CCK.fields.limitTotal)} ({settings.currency})</label>
                <input
                  className="input"
                  type="text"
                  inputMode="decimal"
                  value={formatMoneyInput(formData.limit_total_cents)}
                  onChange={(e) => {
                    const cleaned = cleanMoneyInput(e.target.value);
                    setFormData({ ...formData, limit_total_cents: parseMoneyInput(cleaned) });
                  }}
                  placeholder={getMoneyPlaceholder(settings.currency, locale)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">{t(CCK.fields.limitAvailableInitial)} ({settings.currency})</label>
                <input
                  className="input"
                  type="text"
                  inputMode="decimal"
                  value={formatMoneyInput(formData.limit_available_cents)}
                  onChange={(e) => {
                    const cleaned = cleanMoneyInput(e.target.value);
                    setFormData({ ...formData, limit_available_cents: parseMoneyInput(cleaned) });
                  }}
                  placeholder={getMoneyPlaceholder(settings.currency, locale)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">{t(CCK.fields.closingDay)}</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.closing_day}
                  onChange={(e) => setFormData({ ...formData, closing_day: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">{t(CCK.fields.dueDay)}</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.due_day}
                  onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) || 10 })}
                  required
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                {t(AK.common.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {editingCard ? t(AK.common.save) : t(AK.common.create)}
              </button>
            </div>
          </form>
        </Modal>

        <ImportReceiptModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            loadCards();
          }}
        />

        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setCardToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title={t(CCK.deleteCard) || "Excluir Cartão"}
          message={t(CCK.deleteCardMessage) || "Isso removerá o cartão. Você pode escolher o que fazer com os lançamentos vinculados."}
          confirmLabel={t(AK.common.delete)}
          options={[
            {
              value: "cascade",
              label: t(CCK.deleteCardCascade) || "Excluir lançamentos do cartão também",
              description: t(CCK.deleteCardCascadeDesc) || "Todos os lançamentos vinculados serão excluídos permanentemente.",
            },
            {
              value: "unlink",
              label: t(CCK.deleteCardUnlink) || "Manter lançamentos e marcar como 'sem cartão'",
              description: t(CCK.deleteCardUnlinkDesc) || "Os lançamentos serão mantidos, mas não estarão mais vinculados a nenhum cartão.",
            },
          ]}
          requireCheckbox={true}
          checkboxLabel={t(CCK.deleteCardConfirm) || "Entendo que isso pode afetar históricos"}
          loading={deleting}
        />
      </div>
    </>
  );
}

