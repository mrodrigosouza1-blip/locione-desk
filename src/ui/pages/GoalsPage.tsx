import { useEffect, useMemo, useState } from "react";
import { goalRepository } from "../../infra/repositories/goalRepository";
import { accountRepository } from "../../infra/repositories/accountRepository";
import { formatCurrency } from "../../utils/format";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { parseMoneyInput, formatMoneyInput, cleanMoneyInput, getMoneyPlaceholder } from "../utils/moneyInput";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import GoalDetailsModal from "../components/GoalDetailsModal";
import { Plus, Target, Trash2, Trophy } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { GK } from "../../i18n/keys/goalsKeys";
import { AK } from "../../i18n/keys/appKeys";
import { useToast } from "../hooks/useToast";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { requireGate } from "../../services/requireGate";
import { getUsageCounters } from "../../services/usageCounters";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../shared/components/EmptyState";
import { illustrations } from "../../assets/illustrations";
import { onAppEvent } from "../state/appEvents";

export default function GoalsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [editingEndDate, setEditingEndDate] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "steps" as "steps" | "monthly" | "free",
    target_value_cents: 0,
  });
  // Estados específicos para "Por passo"
  const [stepsCount, setStepsCount] = useState<number>(1);
  const [stepsValueMode, setStepsValueMode] = useState<"fixed_per_step" | "progressive">("fixed_per_step");
  const [stepValue, setStepValue] = useState<string>(""); // Valor por passo (apenas no modo fixed_per_step)
  
  // Estados específicos para "Por mês"
  const [monthNumbers, setMonthNumbers] = useState<number[]>([new Date().getMonth() + 1]); // Array de meses selecionados
  const [dailyValueMode, setDailyValueMode] = useState<"fixed_per_day" | "day_value">("fixed_per_day");
  const [dayValue, setDayValue] = useState<string>(""); // Valor por dia (apenas no modo fixed_per_day)
  
  // Estado para moeda
  const [currency, setCurrency] = useState<string>(() => {
    try {
      const settings = settingsRepository.get();
      return settings.currency || "BRL";
    } catch {
      return "BRL";
    }
  });
  const [depositData, setDepositData] = useState({
    amount_cents: "" as number | string,
    account_id: 0,
  });
  const [withdrawData, setWithdrawData] = useState({
    amount_cents: "" as number | string,
    account_id: 0,
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

  const defaultStartDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  function hashString(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function pickVariant(keys: string[], seed: string) {
    if (keys.length === 1) return keys[0];
    const idx = hashString(seed) % keys.length;
    return keys[idx];
  }

  function getGoalMotivation(goal: any, percentage: number, deposited: number) {
    const seedBase = `${goal.id}-${Math.floor(percentage / 10)}`;
    if (!goal.target_value_cents || goal.target_value_cents <= 0) {
      return t(pickVariant([GK.motivation.noTarget, GK.motivation.noTargetAlt], `${seedBase}-no-target`));
    }
    if (!deposited || deposited <= 0) {
      return t(pickVariant([GK.motivation.firstDeposit, GK.motivation.firstDepositAlt], `${seedBase}-first`));
    }
    if (percentage < 25) {
      return t(pickVariant([GK.motivation.start, GK.motivation.startAlt], `${seedBase}-start`));
    }
    if (percentage < 50) {
      return t(pickVariant([GK.motivation.mid, GK.motivation.midAlt], `${seedBase}-mid`));
    }
    if (percentage < 80) {
      return t(pickVariant([GK.motivation.strong, GK.motivation.strongAlt], `${seedBase}-strong`));
    }
    return t(pickVariant([GK.motivation.finalStretch, GK.motivation.finalStretchAlt], `${seedBase}-final`));
  }

  const goalsByCurrency = useMemo(() => {
    const groups = new Map<string, any[]>();
    goals.forEach((goal) => {
      const currencyCode = goal.currency_code || settings.currency;
      if (!groups.has(currencyCode)) {
        groups.set(currencyCode, []);
      }
      groups.get(currencyCode)!.push(goal);
    });
    return groups;
  }, [goals, settings.currency]);

  const goalsByCurrencyEntries = useMemo(() => {
    return Array.from(goalsByCurrency.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [goalsByCurrency]);

  const isGoalCompleted = (goal: any) =>
    goal.target_value_cents > 0 && (goal.deposited_amount || 0) >= goal.target_value_cents;

  const activeGoalsByCurrencyEntries = useMemo(() => {
    return goalsByCurrencyEntries
      .map(([currencyCode, currencyGoals]) => [
        currencyCode,
        currencyGoals.filter((goal) => !isGoalCompleted(goal)),
      ] as const)
      .filter(([, currencyGoals]) => currencyGoals.length > 0);
  }, [goalsByCurrencyEntries]);

  const completedGoalsByCurrencyEntries = useMemo(() => {
    return goalsByCurrencyEntries
      .map(([currencyCode, currencyGoals]) => [
        currencyCode,
        currencyGoals.filter((goal) => isGoalCompleted(goal)),
      ] as const)
      .filter(([, currencyGoals]) => currencyGoals.length > 0);
  }, [goalsByCurrencyEntries]);

  useEffect(() => {
    loadGoals();
    loadAccounts();
  }, []);

  useEffect(() => {
    if (formData.type !== "monthly") {
      return;
    }
    const targetCents = formData.target_value_cents;
    if (targetCents <= 0) {
      setMonthNumbers([]);
      setEditingEndDate(null);
      return;
    }
    const { months: nextMonths, endDate } = calculateMonthsForTarget(targetCents);
    const nextKey = nextMonths.slice().sort((a, b) => a - b).join(",");
    const currentKey = monthNumbers.slice().sort((a, b) => a - b).join(",");
    if (nextKey !== currentKey) {
      setMonthNumbers(nextMonths);
    }
    if (endDate !== editingEndDate) {
      setEditingEndDate(endDate);
    }
  }, [formData.type, formData.target_value_cents, dailyValueMode, dayValue, defaultStartDate]);

  useEffect(() => {
    const unsubscribe = onAppEvent("data:changed", () => {
      loadGoals();
      loadAccounts();
    });
    return unsubscribe;
  }, []);

  async function loadGoals() {
    setGoals(await goalRepository.findAll());
  }

  async function loadAccounts() {
    setAccounts(await accountRepository.findAll());
  }

  // Função para calcular dias do mês (1..12)
  function daysInMonth(year: number, month1to12: number): number {
    // month1to12: 1=janeiro, 12=dezembro
    // new Date(year, month, 0) retorna o último dia do mês anterior
    return new Date(year, month1to12, 0).getDate();
  }

  // Função pura para calcular total de passos (retorna em centavos)
  function calcStepsTotal(n: number, mode: "fixed_per_step" | "progressive", stepValueCents: number): number {
    if (n <= 0) return 0;
    if (mode === "fixed_per_step") {
      // Total = quantidade de passos * valor por passo (já em centavos)
      return n * stepValueCents;
    } else {
      // Modo progressivo: soma de 1 até N = N*(N+1)/2
      // O resultado está em "unidades", então multiplicamos por 100 para centavos
      const totalUnits = (n * (n + 1)) / 2;
      return totalUnits * 100;
    }
  }

  // Função pura para calcular total mensal (retorna em centavos)
  function calcMonthlyTotal(days: number, mode: "fixed_per_day" | "day_value", dayValueCents: number): number {
    if (days <= 0) return 0;
    if (mode === "fixed_per_day") {
      // Total = dias do mês * valor por dia (já em centavos)
      return days * dayValueCents;
    } else {
      // Modo progressivo: soma de 1 até D = D*(D+1)/2
      // O resultado está em "unidades", então multiplicamos por 100 para centavos
      const totalUnits = (days * (days + 1)) / 2;
      return totalUnits * 100;
    }
  }

  function calculateStepsForTarget(targetValueCents: number): number {
    if (targetValueCents <= 0) return 1;
    if (stepsValueMode === "fixed_per_step") {
      const stepValueCents = parseMoneyInput(stepValue);
      if (stepValueCents <= 0) return stepsCount;
      return Math.max(1, Math.ceil(targetValueCents / stepValueCents));
    }
    const targetUnits = Math.max(1, Math.ceil(targetValueCents / 100));
    return Math.max(1, Math.ceil((Math.sqrt(1 + 8 * targetUnits) - 1) / 2));
  }

  function calculateMonthsForTarget(targetValueCents: number): { months: number[]; endDate: string | null } {
    if (targetValueCents <= 0) return { months: [], endDate: null };
    const startDate = new Date(`${defaultStartDate}T00:00:00`);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const monthOrder = Array.from({ length: 12 - startMonth + 1 }, (_, i) => startMonth + i);
    const valueMode = dailyValueMode;
    const fixedAmountCents = parseMoneyInput(dayValue);

    let remaining = targetValueCents;
    const selected: number[] = [];
    let endDate: string | null = null;

    for (const monthNum of monthOrder) {
      if (remaining <= 0) break;
      const daysInCurrent = daysInMonth(startYear, monthNum);
      const monthStartDay = monthNum === startMonth ? startDay : 1;
      const remainingDays = Math.max(0, daysInCurrent - monthStartDay + 1);
      if (remainingDays <= 0) continue;

      let monthContribution = 0;
      if (valueMode === "fixed_per_day") {
        if (fixedAmountCents <= 0) return { months: monthNumbers, endDate: null };
        monthContribution = remainingDays * fixedAmountCents;
        if (remaining <= monthContribution) {
          const daysNeeded = Math.max(1, Math.ceil(remaining / fixedAmountCents));
          const endDay = Math.min(daysInCurrent, monthStartDay + daysNeeded - 1);
          endDate = `${startYear}-${String(monthNum).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
          selected.push(monthNum);
          break;
        }
      } else {
        const totalUnits = (remainingDays * (monthStartDay + daysInCurrent)) / 2;
        monthContribution = Math.round(totalUnits * 100);
        if (remaining <= monthContribution) {
          const remainingUnits = Math.max(1, Math.ceil(remaining / 100));
          const b = (2 * monthStartDay) - 1;
          const n = Math.max(1, Math.ceil((Math.sqrt((b * b) + (8 * remainingUnits)) - b) / 2));
          const endDay = Math.min(daysInCurrent, monthStartDay + n - 1);
          endDate = `${startYear}-${String(monthNum).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
          selected.push(monthNum);
          break;
        }
      }
      if (monthContribution <= 0) continue;
      selected.push(monthNum);
      remaining -= monthContribution;
    }

    if (!endDate && selected.length > 0) {
      const lastMonth = selected[selected.length - 1];
      endDate = `${startYear}-${String(lastMonth).padStart(2, "0")}-${String(daysInMonth(startYear, lastMonth)).padStart(2, "0")}`;
    }
    return { months: selected.length > 0 ? selected : monthNumbers, endDate };
  }

  // Calcular valor total para "Por passo" (em centavos)
  const calculateTotalForSteps = (): number => {
    if (formData.type !== "steps") return 0;
    const stepValueCents = parseMoneyInput(stepValue);
    return calcStepsTotal(stepsCount, stepsValueMode, stepValueCents);
  };

  // Calcular valor total para "Por mês" (em centavos) - soma todos os meses selecionados
  const calculateTotalForMonthly = (): number => {
    if (formData.type !== "monthly" || monthNumbers.length === 0) return 0;
    if (formData.target_value_cents <= 0) return 0;
    const year = new Date().getFullYear();
    const dayValueCents = parseMoneyInput(dayValue);
    const startDate = new Date(`${defaultStartDate}T00:00:00`);
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endDate = editingEndDate ? new Date(`${editingEndDate}T00:00:00`) : null;
    const endMonth = endDate ? endDate.getMonth() + 1 : null;
    const endDay = endDate ? endDate.getDate() : null;
    
    // Somar o total de cada mês selecionado
    let totalCents = 0;
    for (const monthNum of monthNumbers) {
      const days = daysInMonth(year, monthNum);
      const isStartMonth = monthNum === startMonth;
      const isEndMonth = endMonth ? monthNum === endMonth : false;
      if (!isStartMonth) {
        if (isEndMonth && endDay) {
          if (dailyValueMode === "fixed_per_day") {
            totalCents += endDay * dayValueCents;
          } else {
            const totalUnits = (endDay * (endDay + 1)) / 2;
            totalCents += totalUnits * 100;
          }
        } else {
      totalCents += calcMonthlyTotal(days, dailyValueMode, dayValueCents);
        }
        continue;
      }
      const lastDay = isEndMonth && endDay ? endDay : days;
      const remainingDays = Math.max(0, lastDay - startDay + 1);
      if (remainingDays <= 0) continue;
      if (dailyValueMode === "fixed_per_day") {
        totalCents += remainingDays * dayValueCents;
      } else {
        const totalUnits = (remainingDays * (startDay + lastDay)) / 2;
        totalCents += totalUnits * 100;
      }
    }
    
    return totalCents;
  };

  // Formatar valor total para exibição
  const formatTotalValue = (): string => {
    let totalCents = 0;
    if (formData.type === "steps") {
      totalCents = calculateTotalForSteps();
    } else if (formData.type === "monthly") {
      totalCents = calculateTotalForMonthly();
    } else if (formData.type === "free") {
      totalCents = formData.target_value_cents;
    }
    
    const total = totalCents / 100;
    
    // Sempre mostrar com 2 casas decimais para consistência
    return `${total.toFixed(2)} ${currency}`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validações
    if (!formData.name.trim()) {
      toast.error(t(GK.messages.nameRequired));
      return;
    }

    // Validação de moeda
    if (!currency || currency.trim() === "") {
      toast.error(t(GK.messages.currencyRequired));
      return;
    }

    if (formData.type === "steps") {
      if (stepsCount < 1) {
        toast.error(t(GK.messages.stepsMin));
        return;
      }
      if (stepsValueMode === "fixed_per_step") {
        const stepValueNum = parseMoneyInput(stepValue) / 100;
        if (stepValueNum <= 0) {
          toast.error(t(GK.messages.stepValueRequired));
          return;
        }
      }
    }

    if (formData.type === "monthly") {
      if (monthNumbers.length === 0) {
        toast.error(t(GK.messages.monthRequired));
        return;
      }
      if (monthNumbers.some(m => m < 1 || m > 12)) {
        toast.error(t(GK.messages.monthRange));
        return;
      }
      if (dailyValueMode === "fixed_per_day") {
        const dayValueNum = parseMoneyInput(dayValue) / 100;
        if (dayValueNum <= 0) {
          toast.error(t(GK.messages.dayValueRequired));
          return;
        }
      }
    }

    if (formData.type === "free") {
      if (formData.target_value_cents <= 0) {
        toast.error(t(GK.messages.targetValueRequired));
        return;
      }
    }

    // Calcular target_value_cents
    let targetValueCents = 0;
    if (formData.type === "steps") {
      targetValueCents = calculateTotalForSteps();
    } else if (formData.type === "monthly") {
      targetValueCents = formData.target_value_cents > 0 ? formData.target_value_cents : calculateTotalForMonthly();
    } else if (formData.type === "free") {
      targetValueCents = formData.target_value_cents;
    }

    // Montar config
    const config: any = {};
    if (formData.type === "steps") {
      config.steps_total = stepsCount;
      config.mode = stepsValueMode === "fixed_per_step" ? "fixed" : "by_number";
      if (stepsValueMode === "fixed_per_step") {
        // Salvar valor por passo em centavos
        config.fixed_amount_cents = parseMoneyInput(stepValue);
      }
    } else if (formData.type === "monthly") {
      const year = new Date().getFullYear();
      config.month_numbers = monthNumbers; // Array de meses
      config.year = year;
      config.daily_value_mode = dailyValueMode;
      config.start_date = defaultStartDate;
      if (editingEndDate) {
        config.end_date = editingEndDate;
      }
      if (dailyValueMode === "fixed_per_day") {
        // Salvar valor por dia em centavos
        config.fixed_amount_cents = parseMoneyInput(dayValue);
      }
    }

    try {
      // Modo criação
      if (!editingGoal) {
        // Aplicar gate
        const counters = getUsageCounters();
        if (!requireGate("goals.create", counters, toast, navigate, t)) {
          return;
        }
        
        const createdGoal = await goalRepository.create({
          name: formData.name.trim(),
          type: formData.type, // Usar o tipo do formulário (steps | monthly | free)
          currency_code: currency,
          target_value_cents: targetValueCents,
          config: Object.keys(config).length > 0 ? config : undefined,
        });
        toast.success(t(GK.messages.createSuccess));
        
        // Limpar estados do formulário
        setIsModalOpen(false);
        setEditingGoal(null);
        setFormData({ name: "", type: "steps", target_value_cents: 0 });
        setStepsCount(1);
        setStepsValueMode("fixed_per_step");
        setStepValue("");
        setMonthNumbers([new Date().getMonth() + 1]);
        setDailyValueMode("fixed_per_day");
        setDayValue("");
        const settings = settingsRepository.get();
        setCurrency(settings.currency || "BRL");
        
        // Recarregar lista de metas
        await loadGoals();
        
        // Definir meta criada como selecionada e abrir detalhes
        // Usar setTimeout para garantir que loadGoals terminou
        setTimeout(() => {
          setSelectedGoalId(createdGoal.id);
          setSelectedGoal(createdGoal);
        }, 100);
        return;
      }

      // Modo edição
      await goalRepository.update(editingGoal.id, {
        name: formData.name.trim(),
        type: formData.type, // Usar o tipo do formulário (steps | monthly | free)
        currency_code: currency,
        target_value_cents: targetValueCents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
      toast.success(t(GK.messages.updateSuccess));
      
      // Limpar estados
      setIsModalOpen(false);
      setEditingGoal(null);
      setFormData({ name: "", type: "steps", target_value_cents: 0 });
      setStepsCount(1);
      setStepsValueMode("fixed_per_step");
      setStepValue("");
      setMonthNumbers([new Date().getMonth() + 1]);
      setDailyValueMode("fixed_per_day");
      setDayValue("");
      const settings = settingsRepository.get();
      setCurrency(settings.currency || "BRL");
      await loadGoals();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : (editingGoal ? t(GK.messages.updateSuccess) : t(GK.messages.createError));
      toast.error(msg);
    }
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoal || !depositData.account_id) return;

    // Converter string para centavos no submit
    const rawAmountCents = typeof depositData.amount_cents === "string" 
      ? parseMoneyInput(depositData.amount_cents)
      : depositData.amount_cents;
    
    // REGRA: Depósito entra no dinheiro disponível, aparece separado no detalhe da conta
    const amountCents = Math.abs(rawAmountCents);
    const today = new Date().toISOString().split("T")[0];
    
    await goalRepository.deposit(selectedGoal.id, amountCents, today);
    
    // REGRA: Criar transação de depósito (saída da conta = negativo)
    const { transactionRepository } = await import("../../infra/repositories/transactionRepository");
    await transactionRepository.create({
      type: "goal_deposit",
      amount_cents: -amountCents, // Saída da conta
      date: today,
      competence_month: new Date().toISOString().slice(0, 7),
      description: `Depósito em meta: ${selectedGoal.name}`,
      account_id: depositData.account_id,
    });

    setIsDepositModalOpen(false);
    setDepositData({ amount_cents: "", account_id: accounts[0]?.id || 0 });
    await loadGoals();
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoal || !withdrawData.account_id) return;

    try {
      // Converter string para centavos no submit
      const rawAmountCents = typeof withdrawData.amount_cents === "string" 
        ? parseMoneyInput(withdrawData.amount_cents)
        : withdrawData.amount_cents;
      
      // REGRA: Resgate reduz meta e aumenta conta escolhida
      const amountCents = Math.abs(rawAmountCents);
      const today = new Date().toISOString().split("T")[0];
      
      await goalRepository.withdraw(selectedGoal.id, amountCents, today, withdrawData.account_id);
      
      // REGRA: Criar transação de resgate (entrada na conta = positivo)
      const { transactionRepository } = await import("../../infra/repositories/transactionRepository");
      await transactionRepository.create({
        type: "goal_withdraw",
        amount_cents: amountCents, // Entrada na conta
        date: today,
        competence_month: new Date().toISOString().slice(0, 7),
        description: `Resgate de meta: ${selectedGoal.name}`,
        account_id: withdrawData.account_id,
      });

      setIsWithdrawModalOpen(false);
      setWithdrawData({ amount_cents: "", account_id: accounts[0]?.id || 0 });
      await loadGoals();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(GK.messages.createError);
      toast.error(msg);
    }
  }

  function handleDeleteClick(goal: any) {
    setGoalToDelete(goal);
    setIsDeleteModalOpen(true);
  }

  async function handleDeleteConfirm(option?: string) {
    if (!goalToDelete) return;
    
    setDeleting(true);
    try {
      await goalRepository.delete(goalToDelete.id, { cascade: option === "cascade" });
      toast.success(t(GK.messages.deleteSuccess));
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
      await loadGoals();
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(GK.messages.deleteError);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Topbar
        title={t(GK.title)}
        subtitle={t(GK.subtitle)}
        primaryAction={{
          label: t(GK.newGoal),
          onClick: () => {
            const counters = getUsageCounters();
            if (!requireGate("goals.create", counters, toast, navigate, t)) {
              return;
            }
            navigate("/goals/new");
          },
          icon: <Plus size={16} />,
          variant: "primary",
        }}
        showLockNow={true}
      />
      <div className="content-area">

        {!goals || goals.length === 0 ? (
          <EmptyState
            image={illustrations.empty.goals}
            title={t(GK.empty.title)}
            action={
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const counters = getUsageCounters();
                  if (!requireGate("goals.create", counters, toast, navigate, t)) {
                    return;
                  }
                  navigate("/goals/new");
                }}
              >
                <Plus size={16} />
                {t(AK.common.create)}
              </button>
            }
          />
        ) : (
          <>
            {activeGoalsByCurrencyEntries.length === 0 ? (
              <div style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
                {t(GK.empty.completedOnly)}
              </div>
            ) : (
              activeGoalsByCurrencyEntries.map(([currencyCode, currencyGoals]) => (
                <div key={currencyCode} style={{ marginBottom: "2rem" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                    {currencyCode}
                  </div>
                  <div className="grid grid-3">
                    {currencyGoals.map((goal) => {
                      const deposited = goal.deposited_amount || 0;
                      const percentage = goal.target_value_cents
                        ? (deposited / goal.target_value_cents) * 100
                        : 0;
                      const motivation = getGoalMotivation(goal, percentage, deposited);

                      return (
                        <div key={goal.id} className="card">
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                            <Target size={24} />
                            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, flex: 1 }}>{goal.name}</h3>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: "0.25rem", minWidth: "auto", color: "var(--error)" }}
                                onClick={() => handleDeleteClick(goal)}
                                title={t(AK.common.delete)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div style={{ marginBottom: "0.5rem" }}>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                              {t(GK.display.current)}
                            </div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                              {formatCurrency(deposited, { currency: goal.currency_code || settings.currency })}
                              {goal.target_value_cents && ` / ${formatCurrency(goal.target_value_cents, { currency: goal.currency_code || settings.currency })}`}
                            </div>
                          </div>
                          {goal.target_value_cents && (
                            <div style={{ marginTop: "0.5rem" }}>
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
                          )}
                          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {motivation}
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ flex: 1, fontSize: "0.75rem", padding: "0.5rem" }}
                              onClick={() => {
                                setSelectedGoalId(goal.id);
                              }}
                            >
                              {t(GK.display.details)}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ flex: 1, fontSize: "0.75rem", padding: "0.5rem" }}
                              onClick={() => {
                                setSelectedGoalId(goal.id);
                                setSelectedGoal(goal);
                              }}
                              disabled={!goal.deposited_amount || goal.deposited_amount <= 0}
                            >
                              {t(GK.display.withdraw)}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {completedGoalsByCurrencyEntries.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCompleted((current) => !current)}
                >
                  {showCompleted ? t(GK.completed.hide) : t(GK.completed.show)}
                </button>
              </div>
            )}

            {showCompleted && completedGoalsByCurrencyEntries.map(([currencyCode, currencyGoals]) => (
              <div key={currencyCode} style={{ marginBottom: "2rem" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  {currencyCode}
                </div>
                <div className="grid grid-3">
                  {currencyGoals.map((goal) => {
                    const deposited = goal.deposited_amount || 0;
                    const percentage = goal.target_value_cents
                      ? (deposited / goal.target_value_cents) * 100
                      : 0;

                    return (
                      <div key={goal.id} className="card">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                          <Trophy size={24} />
                          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, flex: 1 }}>{goal.name}</h3>
                          <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 600 }}>
                            {t(GK.completed.badge)}
                          </span>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "0.25rem", minWidth: "auto", color: "var(--error)" }}
                              onClick={() => handleDeleteClick(goal)}
                              title={t(AK.common.delete)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                            {t(GK.display.current)}
                          </div>
                          <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                            {formatCurrency(deposited, { currency: goal.currency_code || settings.currency })}
                            {goal.target_value_cents && ` / ${formatCurrency(goal.target_value_cents, { currency: goal.currency_code || settings.currency })}`}
                          </div>
                        </div>
                        {goal.target_value_cents && (
                          <div style={{ marginTop: "0.5rem" }}>
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
                        )}
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ flex: 1, fontSize: "0.75rem", padding: "0.5rem" }}
                            onClick={() => {
                              setSelectedGoalId(goal.id);
                            }}
                          >
                            {t(GK.display.details)}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setEditingGoal(null);
            setFormData({ name: "", type: "steps" as "steps" | "monthly" | "free", target_value_cents: 0 });
          }} 
          title={editingGoal ? t(GK.editGoal) : t(GK.modals.create.title)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">{t(GK.fields.name)}</label>
              <input
                className="input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder={t(GK.fields.namePlaceholder)}
              />
            </div>
            <div className="form-group">
              <label className="label">{t(GK.fields.type)}</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "steps" | "monthly" | "free" })}
              >
                <option value="steps">{t(GK.types.steps)}</option>
                <option value="monthly">{t(GK.types.monthly)}</option>
                <option value="free">{t(GK.types.free)}</option>
              </select>
            </div>

            {/* Seletor de moeda - aparece após escolher o tipo */}
            {formData.type && (
              <div className="form-group">
                <label className="label">{t(GK.fields.currency)}</label>
                <select
                  className="input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                >
                  <option value="BRL">{t(AK.common.currencies.brl)}</option>
                  <option value="EUR">{t(AK.common.currencies.eur)}</option>
                  <option value="USD">{t(AK.common.currencies.usd)}</option>
                </select>
              </div>
            )}

            {/* Bloco "Por passo" */}
            {formData.type === "steps" && (
              <div style={{ 
                padding: "1rem", 
                background: "var(--bg-secondary)", 
                borderRadius: "8px", 
                marginTop: "1rem",
                border: "1px solid var(--border-primary)"
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>{t(GK.steps.title)}</h3>

                <div className="form-group">
                  <label className="label">{t(GK.fields.targetValue)} ({currency})</label>
                  <input
                    className="input"
                    type="text"
                    inputMode="decimal"
                    value={formData.target_value_cents > 0 ? formatMoneyInput(formData.target_value_cents) : ""}
                    onChange={(e) => {
                      const cleaned = cleanMoneyInput(e.target.value);
                      const targetCents = parseMoneyInput(cleaned);
                      setFormData({ ...formData, target_value_cents: targetCents });
                      const nextSteps = calculateStepsForTarget(targetCents);
                      if (nextSteps !== stepsCount) {
                        setStepsCount(nextSteps);
                      }
                    }}
                    placeholder={getMoneyPlaceholder(currency, locale)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="label">{t(GK.steps.totalSteps)}</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={stepsCount}
                    onChange={(e) => setStepsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">{t(GK.steps.valueMode)}</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="stepsValueMode"
                        value="fixed_per_step"
                        checked={stepsValueMode === "fixed_per_step"}
                        onChange={() => setStepsValueMode("fixed_per_step")}
                      />
                      <span>{t(GK.steps.fixedPerStep)}</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="stepsValueMode"
                        value="progressive"
                        checked={stepsValueMode === "progressive"}
                        onChange={() => setStepsValueMode("progressive")}
                      />
                      <span>{t(GK.steps.progressive)}</span>
                    </label>
                  </div>
                </div>

                {stepsValueMode === "fixed_per_step" && (
                  <div className="form-group">
                    <label className="label">{t(GK.steps.valuePerStep)} ({currency})</label>
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={stepValue}
                      onChange={(e) => setStepValue(cleanMoneyInput(e.target.value))}
                      placeholder={getMoneyPlaceholder(currency, locale)}
                      required
                    />
                  </div>
                )}

                {/* Resumo do valor total */}
                <div style={{ 
                  marginTop: "1rem", 
                  padding: "0.75rem", 
                  background: "var(--bg-primary)", 
                  borderRadius: "4px",
                  border: "1px solid var(--border-primary)"
                }}>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                    {t(GK.steps.totalValue)}:
                  </div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
                    {formatTotalValue()}
                  </div>
                </div>
              </div>
            )}

            {/* Bloco "Por mês" */}
            {formData.type === "monthly" && (() => {
              const year = new Date().getFullYear();
              const monthNames = [
                t(GK.months.january), t(GK.months.february), t(GK.months.march), t(GK.months.april),
                t(GK.months.may), t(GK.months.june), t(GK.months.july), t(GK.months.august),
                t(GK.months.september), t(GK.months.october), t(GK.months.november), t(GK.months.december)
              ];
              
              const toggleMonth = (monthNum: number) => {
                if (monthNumbers.includes(monthNum)) {
                  setMonthNumbers(monthNumbers.filter(m => m !== monthNum));
                } else {
                  setMonthNumbers([...monthNumbers, monthNum].sort((a, b) => a - b));
                }
              };
              
              return (
                <div style={{ 
                  padding: "1rem", 
                  background: "var(--bg-secondary)", 
                  borderRadius: "8px", 
                  marginTop: "1rem",
                  border: "1px solid var(--border-primary)"
                }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>{t(GK.monthly.title)}</h3>

                  <div className="form-group">
                    <label className="label">{t(GK.fields.targetValue)} ({currency})</label>
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      value={formData.target_value_cents > 0 ? formatMoneyInput(formData.target_value_cents) : ""}
                      onChange={(e) => {
                        const cleaned = cleanMoneyInput(e.target.value);
                        const targetCents = parseMoneyInput(cleaned);
                        setFormData({ ...formData, target_value_cents: targetCents });
                        const { months: nextMonths, endDate } = calculateMonthsForTarget(targetCents);
                        const nextKey = nextMonths.slice().sort((a, b) => a - b).join(",");
                        const currentKey = monthNumbers.slice().sort((a, b) => a - b).join(",");
                        if (nextKey !== currentKey) {
                          setMonthNumbers(nextMonths);
                        }
                        setEditingEndDate(endDate);
                      }}
                      placeholder={getMoneyPlaceholder(currency, locale)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="label">{t(GK.monthly.selectedMonths)}</label>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(3, 1fr)", 
                      gap: "0.5rem",
                      marginTop: "0.5rem"
                    }}>
                      {monthNames.map((name, index) => {
                        const monthNum = index + 1;
                        const isSelected = monthNumbers.includes(monthNum);
                        const days = daysInMonth(year, monthNum);
                        return (
                          <label 
                            key={monthNum}
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "0.5rem", 
                              cursor: "pointer",
                              padding: "0.5rem",
                              borderRadius: "4px",
                              background: isSelected ? "var(--bg-primary)" : "transparent",
                              border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-primary)"}`
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMonth(monthNum)}
                            />
                            <span style={{ fontSize: "0.875rem" }}>
                              {String(monthNum).padStart(2, "0")} - {name} ({days}d)
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {monthNumbers.length === 0 && (
                      <div style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.25rem" }}>
                        {t(GK.monthly.selectAtLeastOne)}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="label">{t(GK.monthly.dailyMode)}</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="dailyValueMode"
                          value="fixed_per_day"
                          checked={dailyValueMode === "fixed_per_day"}
                          onChange={() => setDailyValueMode("fixed_per_day")}
                        />
                        <span>{t(GK.monthly.fixedPerDay)}</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="dailyValueMode"
                          value="day_value"
                          checked={dailyValueMode === "day_value"}
                          onChange={() => setDailyValueMode("day_value")}
                        />
                        <span>{t(GK.monthly.dayValue)}</span>
                      </label>
                    </div>
                  </div>

                  {dailyValueMode === "fixed_per_day" && (
                    <div className="form-group">
                      <label className="label">{t(GK.monthly.valuePerDay)} ({currency})</label>
                      <input
                        className="input"
                        type="text"
                        inputMode="decimal"
                        value={dayValue}
                        onChange={(e) => setDayValue(cleanMoneyInput(e.target.value))}
                        placeholder={getMoneyPlaceholder(currency, locale)}
                        required
                      />
                    </div>
                  )}

                  {/* Resumo do valor total */}
                  <div style={{ 
                    marginTop: "1rem", 
                    padding: "0.75rem", 
                    background: "var(--bg-primary)", 
                    borderRadius: "4px",
                    border: "1px solid var(--border-primary)"
                  }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                      {t(GK.monthly.totalValue)}:
                    </div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
                      {formatTotalValue()}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bloco "Livre" */}
            {formData.type === "free" && (
              <div style={{ 
                padding: "1rem", 
                background: "var(--bg-secondary)", 
                borderRadius: "8px", 
                marginTop: "1rem",
                border: "1px solid var(--border-primary)"
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>{t(GK.free.title)}</h3>
                
                <div className="form-group">
                  <label className="label">{t(GK.free.targetValue)} ({currency})</label>
                  <input
                  className="input"
                  type="text"
                  inputMode="decimal"
                  value={formData.target_value_cents > 0 ? formatMoneyInput(formData.target_value_cents) : ""}
                  onChange={(e) => {
                    const cleaned = cleanMoneyInput(e.target.value);
                    setFormData({ ...formData, target_value_cents: parseMoneyInput(cleaned) });
                  }}
                    placeholder={getMoneyPlaceholder(currency, locale)}
                    required
                  />
                </div>

                {/* Resumo do valor total */}
                <div style={{ 
                  marginTop: "1rem", 
                  padding: "0.75rem", 
                  background: "var(--bg-primary)", 
                  borderRadius: "4px",
                  border: "1px solid var(--border-primary)"
                }}>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                    {t(GK.free.totalValue)}:
                  </div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
                    {formatTotalValue()}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setIsModalOpen(false);
                setFormData({ name: "", type: "steps", target_value_cents: 0 });
                setStepsCount(1);
                setStepsValueMode("fixed_per_step");
                setStepValue("");
                setMonthNumbers([new Date().getMonth() + 1]);
                setDailyValueMode("fixed_per_day");
                setDayValue("");
                const settings = settingsRepository.get();
    setCurrency(settings.currency || "BRL");
              }}>
                {t(GK.actions.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {editingGoal ? t(AK.common.save) : t(GK.actions.create)}
              </button>
            </div>
          </form>
        </Modal>

        {selectedGoalId && (
          <GoalDetailsModal
            isOpen={selectedGoalId !== null}
            onClose={() => {
              setSelectedGoalId(null);
              setSelectedGoal(null);
            }}
            goalId={selectedGoalId}
            onSuccess={loadGoals}
            initialMode={selectedGoal && selectedGoal.deposited_amount > 0 ? "withdraw" : "deposit"}
          />
        )}

        <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title={t(GK.modals.deposit.title)}>
          <form onSubmit={handleDeposit}>
            <div className="form-group">
              <label className="label">{t(GK.fields.account)}</label>
              <select
                className="input"
                value={depositData.account_id}
                onChange={(e) => setDepositData({ ...depositData, account_id: parseInt(e.target.value) })}
                required
              >
                <option value="">{t(GK.modals.deposit.selectAccount)}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">{t(GK.fields.valueWithCurrency, { currency: settings.currency })}</label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={typeof depositData.amount_cents === "string" ? depositData.amount_cents : formatMoneyInput(depositData.amount_cents)}
                onChange={(e) => {
                  const cleaned = cleanMoneyInput(e.target.value);
                  setDepositData({ ...depositData, amount_cents: cleaned });
                }}
                placeholder={getMoneyPlaceholder(settings.currency, locale)}
                required
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsDepositModalOpen(false)}>
                {t(GK.actions.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {t(GK.actions.deposit)}
              </button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title={t(GK.modals.withdraw.title)}>
          <form onSubmit={handleWithdraw}>
            <div className="form-group">
              <label className="label">{t(GK.fields.destinationAccount)}</label>
              <select
                className="input"
                value={withdrawData.account_id}
                onChange={(e) => setWithdrawData({ ...withdrawData, account_id: parseInt(e.target.value) })}
                required
              >
                <option value="">{t(GK.modals.withdraw.selectAccount)}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">{t(GK.fields.amount)} ({settings.currency})</label>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={typeof withdrawData.amount_cents === "string" ? withdrawData.amount_cents : formatMoneyInput(withdrawData.amount_cents)}
                onChange={(e) => {
                  const cleaned = cleanMoneyInput(e.target.value);
                  setWithdrawData({ ...withdrawData, amount_cents: cleaned });
                }}
                placeholder={getMoneyPlaceholder(settings.currency, locale)}
                required
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsWithdrawModalOpen(false)}>
                {t(GK.actions.cancel)}
              </button>
              <button type="submit" className="btn btn-primary">
                {t(GK.actions.withdraw)}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setGoalToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title={t(GK.deleteGoal)}
          message={t(GK.deleteGoalMessage)}
          options={
            goalToDelete && goalToDelete.deposited_amount && goalToDelete.deposited_amount > 0
              ? [
                  {
                    value: "cascade",
                    label: t(GK.deleteGoalCascade),
                    description: t(GK.deleteGoalCascadeDesc),
                  },
                  {
                    value: "unlink",
                    label: t(GK.deleteGoalKeep),
                    description: t(GK.deleteGoalKeepDesc),
                  },
                ]
              : undefined
          }
          requireCheckbox={true}
          checkboxLabel={t(GK.deleteGoalConfirm)}
          loading={deleting}
        />
      </div>
    </>
  );
}

