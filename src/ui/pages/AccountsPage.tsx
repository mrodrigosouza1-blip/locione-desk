import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountRepository } from "../../infra/repositories/accountRepository";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { parseMoneyInput, formatMoneyInput, cleanMoneyInput } from "../utils/moneyInput";
import MoneyDisplay from "../components/MoneyDisplay";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import ImportReceiptModal from "../components/ImportReceiptModal";
import { Plus, Wallet, Upload, Edit, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import { AKC } from "../../i18n/keys/accountsKeys";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { useToast } from "../hooks/useToast";
import { requireGate } from "../../services/requireGate";
import { getUsageCounters } from "../../services/usageCounters";
import EmptyState from "../../shared/components/EmptyState";
import { illustrations } from "../../assets/illustrations";

export default function AccountsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
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
  const [formData, setFormData] = useState(() => {
    try {
      const s = settingsRepository.get();
      return {
        name: "",
        type: "checking" as const,
        initial_balance_cents: "" as string | number, // String vazia para permitir placeholder
        currency_code: s.currency,
      };
    } catch {
      return {
        name: "",
        type: "checking" as const,
        initial_balance_cents: "" as string | number,
        currency_code: "BRL",
      };
    }
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    const accountsList = await accountRepository.findAll();
    const accountsWithBalance = await Promise.all(accountsList.map(async (account) => ({
      ...account,
      balance: await accountRepository.getBalance(account.id),
    })));
    setAccounts(accountsWithBalance);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Converter string para centavos no submit
    const initialBalanceCents = typeof formData.initial_balance_cents === "string" 
      ? parseMoneyInput(formData.initial_balance_cents)
      : formData.initial_balance_cents;
    
    if (editingAccount) {
      // Modo edição
      await accountRepository.update(editingAccount.id, {
        name: formData.name,
        type: formData.type,
        initial_balance_cents: initialBalanceCents,
        currency_code: formData.currency_code,
      });
      toast.success(t(AKC.messages.updateSuccess) || "Conta atualizada com sucesso");
      setIsModalOpen(false);
      setEditingAccount(null);
    } else {
      // Modo criação - aplicar gate
      const counters = getUsageCounters();
      if (!requireGate("accounts.create", counters, toast, navigate, t)) {
        return;
      }
      
      await accountRepository.create({
        name: formData.name,
        type: formData.type,
        initial_balance_cents: initialBalanceCents,
        currency_code: formData.currency_code,
      });
      toast.success(t(AKC.messages.createSuccess) || "Conta criada com sucesso");
      setIsModalOpen(false);
    }
    
    setFormData({ name: "", type: "checking", initial_balance_cents: "", currency_code: settings.currency });
    await loadAccounts();
  }

  function handleEdit(account: any) {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      initial_balance_cents: account.initial_balance_cents ? formatMoneyInput(account.initial_balance_cents) : "",
      currency_code: account.currency_code || settings.currency,
    });
    setIsModalOpen(true);
  }

  function handleDeleteClick(account: any) {
    setAccountToDelete(account);
    setIsDeleteModalOpen(true);
  }

  async function handleDeleteConfirm(option: string) {
    if (!accountToDelete) return;
    
    setDeleting(true);
    try {
      const cascade = option === "cascade";
      await accountRepository.delete(accountToDelete.id, { cascade });
      toast.success(t(AKC.messages.deleteSuccess) || "Conta excluída com sucesso");
      setIsDeleteModalOpen(false);
      setAccountToDelete(null);
      
      // Se estava na página de detalhe da conta excluída, navegar de volta
      if (window.location.pathname.includes(`/accounts/${accountToDelete.id}`)) {
        navigate("/accounts");
      }
      
      await loadAccounts();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(AKC.messages.deleteError);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  const accountTypeLabels: Record<string, string> = {
    checking: t(AKC.types.checking),
    savings: t(AKC.types.savings),
    cash: t(AKC.types.cash),
    other: t(AKC.types.other),
  };

  return (
    <>
      <Topbar
        title={t(AKC.title)}
        subtitle={t(AKC.subtitle)}
        primaryAction={{
          label: t(AKC.newAccount),
          onClick: () => {
            const counters = getUsageCounters();
            if (!requireGate("accounts.create", counters, toast, navigate, t)) {
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
        {!accounts || accounts.length === 0 ? (
          <EmptyState
            image={illustrations.empty.accounts}
            title={t(AKC.empty.title)}
            description={t(AKC.empty.message) || undefined}
            action={
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const counters = getUsageCounters();
                  if (!requireGate("accounts.create", counters, toast, navigate, t)) {
                    return;
                  }
                  setIsModalOpen(true);
                }}
              >
                <Plus size={16} />
                {t(AKC.empty.cta)}
              </button>
            }
          />
        ) : (
          <div className="grid grid-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="card"
                style={{ position: "relative" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <Wallet size={24} />
                  <h3 
                    style={{ fontSize: "1.125rem", fontWeight: 600, cursor: "pointer", flex: 1 }}
                    onClick={() => navigate(`/accounts/${account.id}`)}
                  >
                    {account.name}
                  </h3>
                  <div style={{ display: "flex", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem", minWidth: "auto" }}
                      onClick={() => handleEdit(account)}
                      title={t(AK.common.edit)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem", minWidth: "auto", color: "var(--error)" }}
                      onClick={() => handleDeleteClick(account)}
                      title={t(AK.common.delete)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div 
                  style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", cursor: "pointer" }}
                  onClick={() => navigate(`/accounts/${account.id}`)}
                >
                  {accountTypeLabels[account.type]}
                </div>
                <div 
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/accounts/${account.id}`)}
                >
                  <MoneyDisplay
                    amountCents={account.balance}
                    currencyCode={account.currency_code || settings.currency}
                    settings={fullSettings}
                    primaryStyle={{ fontSize: "1.5rem", fontWeight: 600 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setEditingAccount(null);
            setFormData({ name: "", type: "checking", initial_balance_cents: "", currency_code: settings.currency });
          }} 
          title={editingAccount ? t(AKC.editAccount) : t(AKC.newAccount)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">{t(AKC.fields.name)}</label>
              <input
                className="input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">{t(AKC.fields.type)}</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="checking">{t(AKC.types.checking)}</option>
                <option value="savings">{t(AKC.types.savings)}</option>
                <option value="cash">{t(AKC.types.cash)}</option>
                <option value="other">{t(AKC.types.other)}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">{t(AKC.fields.currency)}</label>
              <select
                className="input"
                value={formData.currency_code}
                onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                required
              >
                <option value="BRL">{t(AK.common.currencies.brl)}</option>
                <option value="USD">{t(AK.common.currencies.usd)}</option>
                <option value="EUR">{t(AK.common.currencies.eur)}</option>
                <option value="GBP">{t(AK.common.currencies.gbp)}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">{t(AKC.fields.initialBalance)} ({formData.currency_code})</label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={typeof formData.initial_balance_cents === "string" ? formData.initial_balance_cents : formatMoneyInput(formData.initial_balance_cents)}
                onChange={(e) => {
                  const cleaned = cleanMoneyInput(e.target.value);
                  setFormData({ ...formData, initial_balance_cents: cleaned });
                }}
                placeholder="0"
                required
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                {t(AK.common.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {editingAccount ? t(AK.common.save) : t(AK.common.create)}
              </button>
            </div>
          </form>
        </Modal>

        <ImportReceiptModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            loadAccounts();
          }}
        />

        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setAccountToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title={t(AKC.deleteAccount) || "Excluir Conta"}
          message={t(AKC.deleteAccountMessage) || "Isso removerá a conta. Você pode escolher o que fazer com os lançamentos vinculados."}
          confirmLabel={t(AK.common.delete)}
          options={[
            {
              value: "cascade",
              label: t(AKC.deleteAccountCascade) || "Excluir lançamentos desta conta também",
              description: t(AKC.deleteAccountCascadeDesc) || "Todos os lançamentos vinculados serão excluídos permanentemente.",
            },
            {
              value: "unlink",
              label: t(AKC.deleteAccountUnlink) || "Manter lançamentos e marcar como 'sem conta'",
              description: t(AKC.deleteAccountUnlinkDesc) || "Os lançamentos serão mantidos, mas não estarão mais vinculados a nenhuma conta.",
            },
          ]}
          requireCheckbox={true}
          checkboxLabel={t(AKC.deleteAccountConfirm) || "Entendo que isso pode afetar históricos"}
          loading={deleting}
        />
      </div>
    </>
  );
}

