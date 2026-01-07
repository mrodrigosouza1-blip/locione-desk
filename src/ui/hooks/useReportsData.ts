import { useEffect, useState, useMemo } from "react";
import { transactionRepository } from "../../infra/repositories/transactionRepository";
import { categoryRepository } from "../../infra/repositories/categoryRepository";
import { accountRepository } from "../../infra/repositories/accountRepository";
import { format, startOfMonth, endOfMonth, subMonths, parse } from "date-fns";
import type { Transaction, Category, Account } from "../../domain/types";
import { logger } from "../../utils/logger";

export interface ReportFilters {
  period: "current_month" | "last_month" | "last_3_months" | "last_6_months" | "custom";
  startDate?: string;
  endDate?: string;
  accountId?: number | null;
  currency?: string | "all"; // Moeda específica ou "all" para todas
  movementFilter?: "all" | "income" | "expense"; // Filtro de tipo de lançamento
}

export interface ReportData {
  transactions: Transaction[]; // Todas as transações (para cálculos/gráficos)
  filteredTransactions: Transaction[]; // Transações filtradas por movimento (para lista)
  totalIncome: number;
  totalExpense: number;
  balance: number;
  previousPeriodBalance: number;
  balanceVariation: number;
  balanceVariationPercent: number;
  expensesByCategory: Array<{ categoryId: number; categoryName: string; amount: number; percent: number }>;
  dailyBalance: Array<{ date: string; balance: number }>;
  categoryMap: Map<number, Category>;
  accounts: Account[];
  availableBalance: number; // Saldo disponível da conta (ou soma se todas)
  selectedCurrency: string; // Moeda efetivamente usada no relatório
  availableCurrencies: string[]; // Moedas disponíveis nas transações
  currencyMode: "single" | "multi"; // Modo de moeda: única ou múltiplas
  ui: {
    incomeCard: { value: number; dimmed: boolean; displayDash: boolean };
    expenseCard: { value: number; dimmed: boolean; displayDash: boolean };
  };
}

export function useReportsData(filters: ReportFilters) {
  const [data, setData] = useState<ReportData>({
    transactions: [],
    filteredTransactions: [],
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    previousPeriodBalance: 0,
    balanceVariation: 0,
    balanceVariationPercent: 0,
    expensesByCategory: [],
    dailyBalance: [],
    categoryMap: new Map(),
    accounts: [],
    availableBalance: 0,
    selectedCurrency: "BRL",
    availableCurrencies: [],
    currencyMode: "single",
    ui: {
      incomeCard: { value: 0, dimmed: false, displayDash: false },
      expenseCard: { value: 0, dimmed: false, displayDash: false },
    },
  });
  const [loading, setLoading] = useState(true);

  // Calcular datas do período
  const { startDate, endDate, previousStartDate, previousEndDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (filters.period) {
      case "current_month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "last_month":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case "last_3_months":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "last_6_months":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "custom":
        start = filters.startDate ? parse(filters.startDate, "yyyy-MM-dd", new Date()) : startOfMonth(now);
        end = filters.endDate ? parse(filters.endDate, "yyyy-MM-dd", new Date()) : now;
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    // Período anterior (mesmo tamanho, antes do período atual)
    const periodLength = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - periodLength);

    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      previousStartDate: format(previousStart, "yyyy-MM-dd"),
      previousEndDate: format(previousEnd, "yyyy-MM-dd"),
    };
  }, [filters.period, filters.startDate, filters.endDate]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Carregar dados base
        const [allTransactions, categories, accounts] = await Promise.all([
          transactionRepository.findAll({
            startDate,
            endDate,
            accountId: filters.accountId || undefined,
          }),
          categoryRepository.findAll(),
          accountRepository.findAll(),
        ]);

        let transactions = allTransactions;

        // REGRA DE MOEDA: Determinar moeda efetiva
        let selectedCurrency: string;
        let availableCurrencies: string[] = [];

        if (filters.accountId) {
          // Conta específica: usar moeda da conta
          const account = accounts.find((a) => a.id === filters.accountId);
          selectedCurrency = account?.currency_code || "BRL";
          // Filtrar transações apenas daquela conta (já filtrado pelo repository, mas garantir)
          transactions = transactions.filter((t) => t.account_id === filters.accountId);
        } else {
          // Todas as contas: descobrir moedas presentes
          const accountCurrencies = new Set(
            accounts.map((a) => a.currency_code || "BRL")
          );
          availableCurrencies = Array.from(accountCurrencies).sort();

          // Determinar moeda a usar
          if (filters.currency === "all") {
            // Modo "Todas as moedas": não filtrar, mas marcar
            selectedCurrency = "all";
          } else if (filters.currency) {
            // Moeda específica selecionada
            selectedCurrency = filters.currency;
            // Filtrar transações apenas dessa moeda
            const accountsWithCurrency = accounts
              .filter((a) => (a.currency_code || "BRL") === selectedCurrency)
              .map((a) => a.id);
            transactions = transactions.filter(
              (t) => t.account_id && accountsWithCurrency.includes(t.account_id)
            );
          } else {
            // Auto: usar moeda mais comum
            const currencyCounts = new Map<string, number>();
            transactions.forEach((t) => {
              if (t.account_id) {
                const account = accounts.find((a) => a.id === t.account_id);
                const currency = account?.currency_code || "BRL";
                currencyCounts.set(currency, (currencyCounts.get(currency) || 0) + 1);
              }
            });

            if (currencyCounts.size === 0) {
              selectedCurrency = "BRL"; // Default
            } else if (currencyCounts.size === 1) {
              selectedCurrency = Array.from(currencyCounts.keys())[0];
            } else {
              // Pegar moeda mais comum
              const sorted = Array.from(currencyCounts.entries()).sort(
                (a, b) => b[1] - a[1]
              );
              selectedCurrency = sorted[0][0];
              // Filtrar transações apenas da moeda mais comum
              const accountsWithCurrency = accounts
                .filter((a) => (a.currency_code || "BRL") === selectedCurrency)
                .map((a) => a.id);
              transactions = transactions.filter(
                (t) => t.account_id && accountsWithCurrency.includes(t.account_id)
              );
            }
          }
        }

        // Carregar período anterior para comparação
        let previousTransactions = await transactionRepository.findAll({
          startDate: previousStartDate,
          endDate: previousEndDate,
          accountId: filters.accountId || undefined,
        });

        // Aplicar mesmo filtro de moeda no período anterior
        if (filters.accountId) {
          previousTransactions = previousTransactions.filter(
            (t) => t.account_id === filters.accountId
          );
        } else if (filters.currency && filters.currency !== "all") {
          const accountsWithCurrency = accounts
            .filter((a) => (a.currency_code || "BRL") === filters.currency)
            .map((a) => a.id);
          previousTransactions = previousTransactions.filter(
            (t) => t.account_id && accountsWithCurrency.includes(t.account_id)
          );
        } else if (!filters.currency && availableCurrencies.length > 1) {
          // Auto: usar mesma moeda determinada acima
          const accountsWithCurrency = accounts
            .filter((a) => (a.currency_code || "BRL") === selectedCurrency)
            .map((a) => a.id);
          previousTransactions = previousTransactions.filter(
            (t) => t.account_id && accountsWithCurrency.includes(t.account_id)
          );
        }

        // REGRA CRÍTICA: Filtrar transações de cartão (credit_card_charge)
        // Relatórios de conta NÃO devem incluir transações de cartão
        // Apenas transações com account_id (não credit_card_id) devem aparecer
        // Exceção: card_payment é permitido porque é um pagamento de cartão que sai da conta
        let accountTransactions = transactions.filter(
          (t) => t.account_id != null && (t.credit_card_id == null || t.type === "card_payment")
        );

        // Aplicar filtro de movimento (income/expense) em TODOS os cálculos
        const movementFilter = filters.movementFilter || "all";
        let filteredTransactionsForCalculations = accountTransactions;
        if (movementFilter === "income") {
          filteredTransactionsForCalculations = accountTransactions.filter((t) => t.type === "income");
        } else if (movementFilter === "expense") {
          filteredTransactionsForCalculations = accountTransactions.filter(
            (t) => t.type === "expense" || t.type === "card_payment"
          );
        }

        // Calcular totais aplicando o filtro de movimento
        const totalIncome = filteredTransactionsForCalculations
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Math.max(0, t.amount_cents), 0);

        const totalExpense = filteredTransactionsForCalculations
          .filter((t) => t.type === "expense" || t.type === "card_payment")
          .reduce((sum, t) => sum + Math.abs(Math.min(0, t.amount_cents)), 0);

        const balance = totalIncome - totalExpense;

        // Filtrar período anterior: remover transações de cartão também
        const previousAccountTransactions = previousTransactions.filter(
          (t) => t.account_id != null && (t.credit_card_id == null || t.type === "card_payment")
        );
        
        // Aplicar filtro de conta se necessário
        const previousFiltered = filters.accountId
          ? previousAccountTransactions.filter((t) => t.account_id === filters.accountId)
          : previousAccountTransactions;

        // Calcular saldo do período anterior
        const previousIncome = previousFiltered
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Math.max(0, t.amount_cents), 0);

        const previousExpense = previousFiltered
          .filter((t) => t.type === "expense" || t.type === "card_payment")
          .reduce((sum, t) => sum + Math.abs(Math.min(0, t.amount_cents)), 0);

        const previousPeriodBalance = previousIncome - previousExpense;
        const balanceVariation = balance - previousPeriodBalance;
        const balanceVariationPercent =
          previousPeriodBalance !== 0
            ? (balanceVariation / Math.abs(previousPeriodBalance)) * 100
            : 0;

        // Gastos por categoria (aplicar filtro de movimento)
        const expensesByCategoryMap = new Map<number, number>();
        filteredTransactionsForCalculations
          .filter((t) => t.type === "expense" || t.type === "card_payment")
          .forEach((t) => {
            const categoryId = t.category_id || 1;
            const current = expensesByCategoryMap.get(categoryId) || 0;
            expensesByCategoryMap.set(categoryId, current + Math.abs(t.amount_cents));
          });

        const totalExpenses = Array.from(expensesByCategoryMap.values()).reduce((a, b) => a + b, 0);
        const categoryMap = new Map(categories.map((c) => [c.id, c]));

        const expensesByCategory = Array.from(expensesByCategoryMap.entries())
          .map(([categoryId, amount]) => ({
            categoryId,
            categoryName: categoryMap.get(categoryId)?.name || "Sem categoria",
            amount,
            percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          }))
          .sort((a, b) => b.amount - a.amount);

        // Evolução diária do saldo (últimos 5 dias com movimentação) - aplicar filtro
        const dailyTransactions = new Map<string, number>();
        filteredTransactionsForCalculations.forEach((t) => {
          const current = dailyTransactions.get(t.date) || 0;
          dailyTransactions.set(t.date, current + t.amount_cents);
        });

        // Calcular saldo disponível (respeitando filtro de moeda)
        let availableBalance = 0;
        if (filters.accountId) {
          // Saldo de uma conta específica
          const account = accounts.find((a) => a.id === filters.accountId);
          if (account) {
            availableBalance = await accountRepository.getBalance(filters.accountId);
          }
        } else if (selectedCurrency === "all") {
          // Modo "Todas as moedas": não calcular saldo (seria misturar moedas)
          availableBalance = 0;
        } else {
          // Soma dos saldos apenas das contas da moeda selecionada
          const accountsWithCurrency = accounts.filter(
            (a) => (a.currency_code || "BRL") === selectedCurrency
          );
          for (const account of accountsWithCurrency) {
            const balance = await accountRepository.getBalance(account.id);
            availableBalance += balance;
          }
        }

        const sortedDates = Array.from(dailyTransactions.keys())
          .sort()
          .reverse()
          .slice(0, 5);

        let runningBalance = 0;
        const dailyBalance = sortedDates
          .map((date) => {
            runningBalance += dailyTransactions.get(date) || 0;
            return {
              date,
              balance: runningBalance,
            };
          })
          .reverse();

        // Determinar modo de moeda
        const currencyMode = selectedCurrency === "all" ? "multi" : "single";

        // Estado visual dos cards (para UX: esmaecer e mostrar "—" quando irrelevante)
        const ui = {
          incomeCard: {
            value: totalIncome,
            dimmed: movementFilter === "expense",
            displayDash: movementFilter === "expense",
          },
          expenseCard: {
            value: totalExpense,
            dimmed: movementFilter === "income",
            displayDash: movementFilter === "income",
          },
        };

        setData({
          transactions: accountTransactions, // Todas as transações (para referência)
          filteredTransactions: filteredTransactionsForCalculations, // Transações filtradas (para lista e export)
          totalIncome,
          totalExpense,
          balance,
          previousPeriodBalance,
          balanceVariation,
          balanceVariationPercent,
          expensesByCategory,
          dailyBalance,
          categoryMap,
          accounts,
          availableBalance,
          selectedCurrency,
          availableCurrencies,
          currencyMode,
          ui,
        });
      } catch (error) {
        logger.errorTag("useReportsData", "Erro ao carregar dados de relatório:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [startDate, endDate, previousStartDate, previousEndDate, filters.accountId, filters.currency, filters.movementFilter]);

  return { data, loading, startDate, endDate };
}

