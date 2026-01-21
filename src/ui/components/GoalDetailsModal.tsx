import { useState, useEffect, useMemo } from "react";
import { goalRepository } from "../../infra/repositories/goalRepository";
import { accountRepository } from "../../infra/repositories/accountRepository";
import { transactionRepository } from "../../infra/repositories/transactionRepository";
import { getDatabase, saveDatabaseAsync, getOrCreateMetaVaultAccount } from "../../infra/database";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { formatMoney } from "../../utils/format";
import Modal from "./Modal";
import type { Goal } from "../../domain/types";
import { useI18n } from "../../i18n/I18nProvider";
import { GDK } from "../../i18n/keys/goalDetailsKeys";
import { GK } from "../../i18n/keys/goalsKeys";
import { AK } from "../../i18n/keys/appKeys";
import { useToast } from "../hooks/useToast";
import { logger } from "../../utils/logger";
import { cleanMoneyInput, getMoneyPlaceholder, parseMoneyInput } from "../utils/moneyInput";

interface GoalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: number;
  onSuccess?: () => void;
  initialMode?: "deposit" | "withdraw"; // Modo inicial do modal
}

export default function GoalDetailsModal({ isOpen, onClose, goalId, onSuccess, initialMode = "deposit" }: GoalDetailsModalProps) {
  const { t } = useI18n();
  const toast = useToast();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"deposit" | "withdraw">(initialMode);
  const [fullSettings] = useState(() => {
    try {
      return settingsRepository.getSettings();
    } catch {
      return null;
    }
  });
  const locale = fullSettings?.preferences.locale ?? "pt-BR";

  const isMetaVaultAccount = (account: any) =>
    account?.is_system === true && typeof account?.name === "string" && account.name.startsWith("Cofre Metas");

  const goalCurrency = goal?.currency_code || "BRL";
  const eligibleAccounts = useMemo(() => {
    return accounts.filter(
      (account) =>
        !isMetaVaultAccount(account) && (account.currency_code || "BRL") === goalCurrency
    );
  }, [accounts, goalCurrency]);
  
  // Estados para resgate
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [destinationAccountId, setDestinationAccountId] = useState<number>(0);

  // Estados para "Por passos"
  const [selectedSteps, setSelectedSteps] = useState<Set<number>>(new Set());
  const [depositedSteps, setDepositedSteps] = useState<Set<number>>(new Set()); // Passos já depositados

  // Estados para "Por mês"
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [depositedDates, setDepositedDates] = useState<Set<string>>(new Set());

  // Estado para "Livre"
  const [freeAmount, setFreeAmount] = useState<string>("");

  useEffect(() => {
    if (isOpen && goalId) {
      loadGoal();
      loadAccounts();
    }
  }, [isOpen, goalId]);

  // Helper para detectar tipo baseado em config (fallback para metas antigas)
  function detectGoalType(goal: Goal): "steps" | "monthly" | "free" {
    // Se já tem tipo correto, usar
    if (goal.type === "steps" || goal.type === "monthly" || goal.type === "free") {
      return goal.type;
    }
    
    // Fallback: detectar baseado em config
    if (!goal.config) return "free";
    
    try {
      const config = typeof goal.config === "string" ? JSON.parse(goal.config) : goal.config;
      if (config.steps_total) return "steps";
      if (config.month_numbers || config.months_selected) return "monthly";
    } catch {
      // Ignorar erro de parse
    }
    
    return "free";
  }

  async function loadGoal() {
    const g = await goalRepository.findById(goalId);
    if (g) {
      // Normalizar tipo usando helper
      const normalizedGoal = { ...g, type: detectGoalType(g) };
      setGoal(normalizedGoal);
      // Resetar seleções ao carregar
      setSelectedSteps(new Set());
      setSelectedDates(new Set());
      setFreeAmount("");
      
      // Carregar passos já depositados (apenas para metas tipo steps)
      if (normalizedGoal.type === "steps") {
        const movements = await goalRepository.getMovements(goalId);
        const deposited = new Set<number>();
        
        for (const movement of movements) {
          if (movement.type === "deposit" && movement.meta?.selected_units) {
            // selected_units é array de números para steps
            const units = movement.meta.selected_units;
            if (Array.isArray(units)) {
              for (const unit of units) {
                if (typeof unit === "number") {
                  deposited.add(unit);
                }
              }
            }
          }
        }
        
        setDepositedSteps(deposited);
      }

      // Carregar dias já depositados (apenas para metas tipo monthly)
      if (normalizedGoal.type === "monthly") {
        const movements = await goalRepository.getMovements(goalId);
        const deposited = new Set<string>();

        for (const movement of movements) {
          if (movement.type === "deposit" && movement.meta?.selected_units) {
            const units = movement.meta.selected_units;
            if (Array.isArray(units)) {
              for (const unit of units) {
                if (typeof unit === "string") {
                  deposited.add(unit);
                }
              }
            }
          }
        }

        setDepositedDates(deposited);
      }
    }
  }

  async function loadAccounts() {
    const accs = await accountRepository.findAll();
    setAccounts(accs);
    if (accs.length > 0) {
      setSourceAccountId(accs[0].id);
      setDestinationAccountId(accs[0].id);
    }
  }

  useEffect(() => {
    if (eligibleAccounts.length > 0) {
      setSourceAccountId((current) =>
        eligibleAccounts.some((account) => account.id === current) ? current : eligibleAccounts[0].id
      );
      setDestinationAccountId((current) =>
        eligibleAccounts.some((account) => account.id === current) ? current : eligibleAccounts[0].id
      );
    } else {
      setSourceAccountId(0);
      setDestinationAccountId(0);
    }
  }, [eligibleAccounts]);
  
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Calcular valor a depositar baseado no tipo
  function calculateDepositAmount(): number {
    if (!goal) return 0;
    
    const goalType = detectGoalType(goal);

    if (goalType === "steps") {
      if (!goal.config) return 0;
      try {
        const config = typeof goal.config === "string" ? JSON.parse(goal.config) : goal.config;
        const selectedStepsArray = Array.from(selectedSteps).sort((a, b) => a - b);
        
        if (selectedStepsArray.length === 0) return 0;

        if (config.mode === "fixed" && config.fixed_amount_cents) {
          // Valor fixo por passo
          return selectedStepsArray.length * config.fixed_amount_cents;
        } else if (config.mode === "by_number") {
          // Valor progressivo: soma dos valores dos passos selecionados
          return selectedStepsArray.reduce((sum, step) => sum + step * 100, 0);
        }
      } catch (error) {
        logger.errorTag("GoalDetailsModal", "Erro ao calcular valor de passos:", error);
      }
      return 0;
    }

    if (goalType === "monthly") {
      if (!goal.config) return 0;
      try {
        const config = typeof goal.config === "string" ? JSON.parse(goal.config) : goal.config;
        const selectedDatesArray = Array.from(selectedDates);
        
        if (selectedDatesArray.length === 0) return 0;

        if (config.daily_value_mode === "fixed_per_day" && config.fixed_amount_cents) {
          // Valor fixo por dia
          return selectedDatesArray.length * config.fixed_amount_cents;
        } else if (config.daily_value_mode === "day_value") {
          // Valor = número do dia: soma do dia do mês de cada data
          return selectedDatesArray.reduce((sum, dateStr) => {
            const date = new Date(dateStr);
            const dayOfMonth = date.getDate();
            return sum + dayOfMonth * 100; // Converter para centavos
          }, 0);
        }
      } catch (error) {
        logger.errorTag("GoalDetailsModal", "Erro ao calcular valor mensal:", error);
      }
      return 0;
    }

    if (goalType === "free") {
      return Math.round(parseFloat(freeAmount || "0") * 100);
    }

    return 0;
  }

  async function handleConfirmDeposit() {
    if (!goal || !sourceAccountId) {
      toast.warning(t(GK.messages.selectAccount));
      return;
    }

    const selectedSource = accounts.find((account) => account.id === sourceAccountId);
    if (!selectedSource) {
      toast.warning(t(GK.messages.accountNotFound));
      return;
    }
    if ((selectedSource.currency_code || "BRL") !== goalCurrency) {
      toast.warning(t(GK.messages.currencyMismatch));
      return;
    }

    const goalType = detectGoalType(goal);
    
    // Validar que nenhum passo selecionado já foi depositado (apenas para steps)
    if (goalType === "steps") {
      const selectedArray = Array.from(selectedSteps);
      const alreadyDeposited = selectedArray.filter(step => depositedSteps.has(step));
      if (alreadyDeposited.length > 0) {
        toast.warning(t(GK.messages.stepsAlreadyDeposited, { steps: alreadyDeposited.join(", ") }));
        return;
      }
    }

    const amountCents = calculateDepositAmount();
    if (amountCents <= 0) {
      toast.warning(t(GK.messages.valueMustBePositive));
      return;
    }

    setIsLoading(true);
    try {
      const db = getDatabase();
      const today = new Date().toISOString().split("T")[0];

      const goalType = detectGoalType(goal);
      
      // 1) Criar movimento da meta (apenas 1 movimento)
      let meta: any = { goal_type: goalType };
      if (goalType === "steps") {
        meta.selected_units = Array.from(selectedSteps).sort((a, b) => a - b);
      } else if (goalType === "monthly") {
        meta.selected_units = Array.from(selectedDates).sort();
      }

      // Obter conta "Cofre Metas" para a moeda da meta (destino fixo)
      const vaultAccount = await getOrCreateMetaVaultAccount(goal.currency_code);

      await goalRepository.createMovement({
        goal_id: goal.id,
        type: "deposit",
        amount_cents: amountCents,
        currency: goal.currency_code,
        source_account_id: sourceAccountId,
        destination_account_id: vaultAccount.id,
        date: today,
        description: `Depósito em meta: ${goal.name}`,
        meta,
      });

      // 2) Atualizar deposited_amount da meta (APENAS 1 VEZ)
      const goalIndex = db.goals.findIndex((g: any) => g.id === goal.id);
      if (goalIndex !== -1) {
        db.goals[goalIndex].deposited_amount = (db.goals[goalIndex].deposited_amount || 0) + amountCents;
        db.goals[goalIndex].updated_at = new Date().toISOString();
      }

      // 3) Criar 2 transações (transferência real)
      // A) SAÍDA na conta source
      await transactionRepository.create({
        type: "expense",
        amount_cents: -amountCents, // Negativo = saída
        date: today,
        competence_month: new Date().toISOString().slice(0, 7),
        description: `Depósito Meta (${goal.name})`,
        account_id: sourceAccountId,
        category_id: 1, // Sem categoria
      });

      // B) ENTRADA na conta "Cofre Metas"
      await transactionRepository.create({
        type: "income",
        amount_cents: amountCents, // Positivo = entrada
        date: today,
        competence_month: new Date().toISOString().slice(0, 7),
        description: `Depósito Meta (${goal.name})`,
        account_id: vaultAccount.id,
        category_id: 1, // Sem categoria
      });

      await saveDatabaseAsync();

      // Fechar e atualizar
      // Recarregar goal para atualizar depositedSteps
      await loadGoal();
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(GK.messages.depositError);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmWithdraw() {
    if (!goal || !destinationAccountId) {
      toast.warning(t(GK.messages.selectAccount));
      return;
    }

    const amountCents = parseMoneyInput(withdrawAmount);
    
    // Validações
    if (amountCents <= 0) {
      toast.warning(t(GK.messages.valueMustBePositive));
      return;
    }

    const deposited = goal.deposited_amount || 0;
    if (amountCents > deposited) {
      toast.warning(t(GK.messages.insufficientBalance) || "Valor insuficiente na meta");
      return;
    }

    // Validar moeda da conta destino
    const destinationAccount = accounts.find(a => a.id === destinationAccountId);
    if (!destinationAccount) {
      toast.error(t(GK.messages.accountNotFound) || "Conta não encontrada");
      return;
    }

    if ((destinationAccount.currency_code || "BRL") !== goalCurrency) {
      toast.warning(t(GK.messages.currencyMismatch) || "A conta destino deve ter a mesma moeda da meta");
      return;
    }

    setIsLoading(true);
    try {
      const db = getDatabase();
      const today = new Date().toISOString().split("T")[0];
      const goalType = detectGoalType(goal);

      // Obter conta "Cofre Metas" para a moeda da meta (origem)
      const vaultAccount = await getOrCreateMetaVaultAccount(goal.currency_code);

      // 1) Criar movimento da meta
      await goalRepository.createMovement({
        goal_id: goal.id,
        type: "withdraw",
        amount_cents: amountCents,
        currency: goal.currency_code,
        source_account_id: vaultAccount.id,
        destination_account_id: destinationAccountId,
        date: today,
        description: `Resgate de meta: ${goal.name}`,
        meta: { goal_type: goalType },
      });

      // 2) Atualizar deposited_amount da meta (REDUZIR)
      const goalIndex = db.goals.findIndex((g: any) => g.id === goal.id);
      if (goalIndex !== -1) {
        db.goals[goalIndex].deposited_amount = Math.max(0, (db.goals[goalIndex].deposited_amount || 0) - amountCents);
        db.goals[goalIndex].updated_at = new Date().toISOString();
      }

      // 3) Criar 2 transações (transferência real)
      // A) SAÍDA do cofre (expense negativo)
      await transactionRepository.create({
        type: "expense",
        amount_cents: -amountCents, // Negativo = saída
        date: today,
        competence_month: new Date().toISOString().slice(0, 7),
        description: `Resgate Meta (${goal.name})`,
        account_id: vaultAccount.id,
        category_id: 1, // Sem categoria
      });

      // B) ENTRADA na conta destino (income positivo)
      await transactionRepository.create({
        type: "income",
        amount_cents: amountCents, // Positivo = entrada
        date: today,
        competence_month: new Date().toISOString().slice(0, 7),
        description: `Resgate Meta (${goal.name})`,
        account_id: destinationAccountId,
        category_id: 1, // Sem categoria
      });

      await saveDatabaseAsync();

      toast.success(t(GK.messages.withdrawSuccess) || "Resgate realizado com sucesso");
      
      // Limpar estados
      setWithdrawAmount("");
      
      // Recarregar goal
      await loadGoal();
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : (t(GK.messages.withdrawError) || "Erro ao realizar resgate");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }
  
  if (!goal) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t(GDK.title)}>
        <div>{t(GDK.loading)}</div>
      </Modal>
    );
  }

  const deposited = goal.deposited_amount || 0;
  const percentage = goal.target_value_cents ? (deposited / goal.target_value_cents) * 100 : 0;
  const depositAmount = calculateDepositAmount();
  const withdrawAmountCents = parseMoneyInput(withdrawAmount);
  const availableBalance = deposited;
  const fixedValueText = (() => {
    if (!goal.config) return null;
    let config: any;
    try {
      config = typeof goal.config === "string" ? JSON.parse(goal.config) : goal.config;
    } catch {
      return null;
    }
    const goalType = detectGoalType(goal);
    if (goalType === "steps" && config.mode === "fixed" && config.fixed_amount_cents) {
      return t(GK.details.fixedValue, { value: formatMoney(config.fixed_amount_cents, goal.currency_code) });
    }
    if (goalType === "monthly" && (config.daily_value_mode === "fixed_per_day" || config.mode === "fixed") && config.fixed_amount_cents) {
      return t(GK.details.fixedValuePerDay, { value: formatMoney(config.fixed_amount_cents, goal.currency_code) });
    }
    return null;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(GDK.titleWithName, { name: goal.name })}>
      <div style={{ padding: "1rem" }}>
        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
          {t(GK.fields.type)}: {t(GK.types[detectGoalType(goal)])}
        </div>
        {fixedValueText && (
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            {fixedValueText}
          </div>
        )}
        {/* Progresso */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
            {t(GK.display.current)}
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            {formatMoney(deposited, goal.currency_code)} / {formatMoney(goal.target_value_cents, goal.currency_code)}
          </div>
          <div style={{
            height: "8px",
            background: "var(--bg-tertiary)",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              height: "100%",
              width: `${Math.min(percentage, 100)}%`,
              background: "var(--accent-primary)",
              transition: "width 0.3s"
            }} />
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {percentage.toFixed(1)}% {t(GK.display.completed)}
          </div>
        </div>

        {/* Tabs para alternar entre Depósito e Resgate */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-primary)" }}>
          <button
            type="button"
            onClick={() => setMode("deposit")}
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              background: "transparent",
              borderBottom: mode === "deposit" ? "2px solid var(--accent-primary)" : "2px solid transparent",
              color: mode === "deposit" ? "var(--accent-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              fontWeight: mode === "deposit" ? 600 : 400
            }}
          >
            {t(GK.actions.deposit)}
          </button>
          <button
            type="button"
            onClick={() => setMode("withdraw")}
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              background: "transparent",
              borderBottom: mode === "withdraw" ? "2px solid var(--accent-primary)" : "2px solid transparent",
              color: mode === "withdraw" ? "var(--accent-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              fontWeight: mode === "withdraw" ? 600 : 400
            }}
          >
            {t(GK.actions.withdraw)}
          </button>
        </div>

        {/* UI de DEPÓSITO */}
        {mode === "deposit" && (
          <>
            {/* UI específica por tipo */}
            {detectGoalType(goal) === "steps" && (
              <StepsDepositUI
                goal={goal}
                selectedSteps={selectedSteps}
                setSelectedSteps={setSelectedSteps}
                depositedSteps={depositedSteps}
              />
            )}

            {detectGoalType(goal) === "monthly" && (
              <MonthlyDepositUI
                goal={goal}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedDates={selectedDates}
                setSelectedDates={setSelectedDates}
                depositedDates={depositedDates}
              />
            )}

            {detectGoalType(goal) === "free" && (
              <FreeDepositUI
                goal={goal}
                freeAmount={freeAmount}
                setFreeAmount={setFreeAmount}
              />
            )}

            {/* Conta de origem */}
            <div className="form-group" style={{ marginTop: "1.5rem" }}>
              <label className="label">{t(GK.details.withdrawFromAccount)}</label>
              <select
                className="input"
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(parseInt(e.target.value))}
                required
                disabled={eligibleAccounts.length === 0}
              >
                <option value="">{t(GK.details.selectAccount)}</option>
                {eligibleAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency_code || "BRL"})
                  </option>
                ))}
              </select>
              {eligibleAccounts.length === 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: "0.25rem" }}>
                  {t(GK.messages.currencyMismatch)}
                </div>
              )}
            </div>

            {/* Valor a depositar */}
            <div style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: "var(--bg-primary)",
              borderRadius: "4px",
              border: "1px solid var(--border-primary)"
            }}>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                Valor a depositar:
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
                {formatMoney(depositAmount, goal.currency_code)}
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
                {t(AK.common.cancel)}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDeposit}
                disabled={isLoading || depositAmount <= 0 || !sourceAccountId}
              >
                {isLoading ? t(AK.common.processing) : t(GK.actions.deposit)}
              </button>
            </div>
          </>
        )}

        {/* UI de RESGATE */}
        {mode === "withdraw" && (
          <>
            {/* Saldo disponível */}
            <div style={{
              marginBottom: "1rem",
              padding: "0.75rem",
              background: "var(--bg-secondary)",
              borderRadius: "4px",
              border: "1px solid var(--border-primary)"
            }}>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                Saldo disponível para resgate:
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
                {formatMoney(availableBalance, goal.currency_code)}
              </div>
            </div>

            {/* Valor a resgatar */}
            <div className="form-group">
              <label className="label">{t(GK.modals.withdraw.amount) || "Valor a resgatar"}</label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                min="0.01"
                max={availableBalance / 100}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(cleanMoneyInput(e.target.value))}
                placeholder={getMoneyPlaceholder(goalCurrency, locale)}
                required
              />
              {withdrawAmountCents > availableBalance && (
                <div style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.25rem" }}>
                  {t(GK.messages.insufficientBalance) || "Valor insuficiente na meta"}
                </div>
              )}
            </div>

            {/* Conta destino */}
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="label">{t(GK.modals.withdraw.selectAccount)}</label>
              <select
                className="input"
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(parseInt(e.target.value))}
                required
                disabled={eligibleAccounts.length === 0}
              >
                <option value="">{t(GK.modals.withdraw.selectAccount)}</option>
                {eligibleAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.currency_code || "BRL"})
                    </option>
                  ))}
              </select>
              {eligibleAccounts.length === 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: "0.25rem" }}>
                  {t(GK.messages.currencyMismatch)}
                </div>
              )}
            </div>

            {/* Valor calculado */}
            {withdrawAmountCents > 0 && (
              <div style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: "var(--bg-primary)",
                borderRadius: "4px",
                border: "1px solid var(--border-primary)"
              }}>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                  Valor a resgatar:
                </div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600, color: withdrawAmountCents > availableBalance ? "var(--error)" : "var(--accent-primary)" }}>
                  {formatMoney(withdrawAmountCents, goal.currency_code)}
                </div>
              </div>
            )}

            {/* Botões */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
                {t(AK.common.cancel)}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmWithdraw}
                disabled={isLoading || withdrawAmountCents <= 0 || withdrawAmountCents > availableBalance || !destinationAccountId}
              >
                {isLoading ? t(AK.common.processing) : t(GK.actions.withdraw)}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// Componente para UI de "Por passos"
function StepsDepositUI({ goal, selectedSteps, setSelectedSteps, depositedSteps }: {
  goal: Goal;
  selectedSteps: Set<number>;
  setSelectedSteps: (steps: Set<number>) => void;
  depositedSteps: Set<number>;
}) {
  const { t } = useI18n();
  const [stepPage, setStepPage] = useState(0);
  const pageSize = 25;
  
  if (!goal.config) return <div>{t(GK.details.configNotFound)}</div>;

  let config: any;
  try {
    config = typeof goal.config === "string" ? JSON.parse(goal.config) : goal.config;
  } catch {
    return <div>{t(GK.details.configLoadError)}</div>;
  }

  const stepsTotal = config.steps_total || 1;
  const totalPages = Math.ceil(stepsTotal / pageSize);
  
  // Encontrar primeira página com passo não depositado (ou começar na 0)
  useEffect(() => {
    if (stepsTotal > 0) {
      // Encontrar menor passo não depositado
      let firstUndeposited = -1;
      for (let i = 1; i <= stepsTotal; i++) {
        if (!depositedSteps.has(i)) {
          firstUndeposited = i;
          break;
        }
      }
      
      // Se encontrou, ir para a página dele
      if (firstUndeposited > 0) {
        const targetPage = Math.floor((firstUndeposited - 1) / pageSize);
        setStepPage(targetPage);
      } else {
        setStepPage(0);
      }
    }
  }, [stepsTotal, depositedSteps]);

  const toggleStep = (stepNum: number) => {
    // Não permitir toggle em passos já depositados
    if (depositedSteps.has(stepNum)) {
      return;
    }
    
    const newSet = new Set(selectedSteps);
    if (newSet.has(stepNum)) {
      newSet.delete(stepNum);
    } else {
      newSet.add(stepNum);
    }
    setSelectedSteps(newSet);
  };

  // Calcular range de steps da página atual
  const startStep = stepPage * pageSize + 1;
  const endStep = Math.min(startStep + pageSize - 1, stepsTotal);
  const currentPageSteps = Array.from({ length: endStep - startStep + 1 }, (_, i) => startStep + i);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div className="form-group">
        <label className="label">{t(GK.details.selectSteps)}</label>
        
        {/* Grid de steps da página atual */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
          gap: "0.5rem",
          padding: "0.5rem",
          background: "var(--bg-secondary)",
          borderRadius: "4px",
          border: "1px solid var(--border-primary)",
          minHeight: "200px"
        }}>
          {currentPageSteps.map((stepNum) => {
            const isSelected = selectedSteps.has(stepNum);
            const isDeposited = depositedSteps.has(stepNum);
            return (
              <button
                key={stepNum}
                type="button"
                onClick={() => toggleStep(stepNum)}
                disabled={isDeposited}
                style={{
                  padding: "0.75rem",
                  borderRadius: "4px",
                  border: `2px solid ${isSelected ? "var(--accent-primary)" : isDeposited ? "var(--border-primary)" : "var(--border-primary)"}`,
                  background: isSelected ? "var(--accent-primary)" : isDeposited ? "var(--bg-tertiary)" : "var(--bg-primary)",
                  color: isSelected ? "white" : isDeposited ? "var(--text-secondary)" : "var(--text-primary)",
                  cursor: isDeposited ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: isSelected ? 600 : 400,
                  opacity: isDeposited ? 0.5 : 1,
                  transition: "all 0.2s"
                }}
                title={isDeposited ? t(GK.display.stepAlreadyDeposited) : undefined}
              >
                {stepNum}
                {isDeposited && " ✓"}
              </button>
            );
          })}
        </div>
        
        {/* Controles de paginação */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "0.75rem",
            gap: "0.5rem"
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStepPage(Math.max(0, stepPage - 1))}
              disabled={stepPage === 0}
              style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
            >
              {t(AK.common.previous)}
            </button>
            
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {t("goals.details.pageInfo", { current: stepPage + 1, total: totalPages, start: startStep, end: endStep, totalSteps: stepsTotal }) || `Página ${stepPage + 1} de ${totalPages} (${startStep}-${endStep} de ${stepsTotal})`}
            </div>
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStepPage(Math.min(totalPages - 1, stepPage + 1))}
              disabled={stepPage >= totalPages - 1}
              style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
            >
              {t(AK.common.next)}
            </button>
          </div>
        )}
        
        {/* Botões rápidos de página (opcional, apenas se muitas páginas) */}
        {totalPages > 3 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.25rem",
            marginTop: "0.5rem",
            justifyContent: "center"
          }}>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i).map((page) => (
              <button
                key={page}
                type="button"
                className="btn btn-secondary"
                onClick={() => setStepPage(page)}
                disabled={stepPage === page}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  minWidth: "auto",
                  opacity: stepPage === page ? 1 : 0.6
                }}
              >
                {page + 1}
              </button>
            ))}
            {totalPages > 10 && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0.25rem" }}>
                ...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para UI de "Por mês"
function MonthlyDepositUI({ goal, selectedMonth, setSelectedMonth, selectedDates, setSelectedDates, depositedDates }: {
  goal: Goal;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedDates: Set<string>;
  setSelectedDates: (dates: Set<string>) => void;
  depositedDates: Set<string>;
}) {
  const { t } = useI18n();
  if (!goal.config) return <div>{t(GK.details.configNotFound)}</div>;

  let config: any;
  try {
    config = typeof goal.config === "string" ? JSON.parse(goal.config) : goal.config;
  } catch {
    return <div>{t(GK.details.configLoadError)}</div>;
  }

  const year = config.year || new Date().getFullYear();
  const monthNumbers = config.month_numbers || config.months_selected || [];
  const startDateStr = config.start_date;
  const startDate = startDateStr ? new Date(startDateStr + "T00:00:00") : null;
  const minMonth = startDate ? startDate.getMonth() + 1 : null;
  const minYear = startDate ? startDate.getFullYear() : null;
  const minDayForSelectedMonth =
    startDate && selectedMonth === minMonth && year === minYear ? startDate.getDate() : 1;

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Calcular dias do mês
  function daysInMonth(year: number, month1to12: number): number {
    return new Date(year, month1to12, 0).getDate();
  }

  // Obter primeiro dia da semana do mês (0=domingo, 1=segunda...)
  function getFirstDayOfWeek(year: number, month1to12: number): number {
    return new Date(year, month1to12 - 1, 1).getDay();
  }

  const days = daysInMonth(year, selectedMonth);
  const firstDay = getFirstDayOfWeek(year, selectedMonth);
  const daysArray = Array.from({ length: days }, (_, i) => i + 1);

  const toggleDate = (day: number) => {
    if (day < minDayForSelectedMonth) {
      return;
    }
    const dateStr = `${year}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (depositedDates.has(dateStr)) {
      return;
    }
    const newSet = new Set(selectedDates);
    if (newSet.has(dateStr)) {
      newSet.delete(dateStr);
    } else {
      newSet.add(dateStr);
    }
    setSelectedDates(newSet);
  };

  const isDateSelected = (day: number) => {
    const dateStr = `${year}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return selectedDates.has(dateStr);
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div className="form-group">
        <label className="label">{t(GK.details.month)}</label>
        <select
          className="input"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
        >
          {monthNumbers.map((monthNum: number) => (
            <option key={monthNum} value={monthNum}>
              {String(monthNum).padStart(2, "0")} - {monthNames[monthNum - 1]} {year}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="label">{t(GK.details.selectDates)}</label>
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: "4px",
          padding: "0.75rem",
          border: "1px solid var(--border-primary)"
        }}>
          {/* Header com dias da semana */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "0.25rem",
            marginBottom: "0.5rem"
          }}>
            {weekDays.map((day) => (
              <div key={day} style={{
                textAlign: "center",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-secondary)"
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "0.25rem"
          }}>
            {/* Espaços vazios antes do primeiro dia */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Dias do mês */}
            {daysArray.map((day) => {
              const isSelected = isDateSelected(day);
              const dateStr = `${year}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isDeposited = depositedDates.has(dateStr);
              const isDisabled = day < minDayForSelectedMonth || isDeposited;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDate(day)}
                  disabled={isDisabled}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: `2px solid ${isSelected ? "var(--accent-primary)" : "var(--border-primary)"}`,
                    background: isSelected ? "var(--accent-primary)" : isDeposited ? "var(--bg-tertiary)" : "var(--bg-primary)",
                    color: isSelected ? "white" : isDeposited ? "var(--text-secondary)" : "var(--text-primary)",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: isSelected ? 600 : 400,
                    transition: "all 0.2s",
                    opacity: isDisabled ? 0.5 : 1
                  }}
                  title={isDeposited ? t(GK.display.stepAlreadyDeposited) : undefined}
                >
                  {day}
                  {isDeposited && " ✓"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para UI de "Livre"
function FreeDepositUI({ goal, freeAmount, setFreeAmount }: {
  goal: Goal;
  freeAmount: string;
  setFreeAmount: (amount: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div className="form-group">
        <label className="label">{t(GK.details.depositAmount, { currency: goal.currency_code })}</label>
        <input
          className="input"
          type="number"
          step="0.01"
          min="0.01"
          value={freeAmount}
          onChange={(e) => setFreeAmount(e.target.value)}
          required
        />
      </div>
    </div>
  );
}

