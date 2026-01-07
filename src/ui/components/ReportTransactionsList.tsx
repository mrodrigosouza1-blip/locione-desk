import { useState, useMemo, useEffect } from "react";
import type { Transaction, Account, Category } from "../../domain/types";
import { formatDateString, formatCurrency } from "../../utils/format";
import { useI18n } from "../../i18n/I18nProvider";
import { RK } from "../../i18n/keys/reportsKeys";
import { AK } from "../../i18n/keys/appKeys";

interface ReportTransactionsListProps {
  transactions: Transaction[];
  accounts: Account[];
  categoryMap: Map<number, Category>;
  currencyMode: "single" | "multi";
  selectedCurrency: string;
  exportMode?: boolean; // true para modo export/print (sem paginação)
}

export default function ReportTransactionsList({
  transactions,
  accounts,
  categoryMap,
  currencyMode,
  selectedCurrency,
  exportMode = false,
}: ReportTransactionsListProps) {
  const { t } = useI18n();
  const [itemsToShow, setItemsToShow] = useState(20);

  // Resetar paginação quando transações mudarem
  useEffect(() => {
    setItemsToShow(20);
  }, [transactions.length]);

  // Agrupar transações por moeda se currencyMode === "multi"
  const groupedByCurrency = useMemo(() => {
    if (currencyMode === "single") {
      return null;
    }

    const groups = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const account = accounts.find((a) => a.id === t.account_id);
      const currency = account?.currency_code || "BRL";
      if (!groups.has(currency)) {
        groups.set(currency, []);
      }
      groups.get(currency)!.push(t);
    });

    // Ordenar transações dentro de cada grupo por data (mais recente primeiro)
    groups.forEach((transactions) => {
      transactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    });

    return groups;
  }, [transactions, accounts, currencyMode]);

  // Ordenar transações (mais recente primeiro)
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
    return sorted;
  }, [transactions]);

  // Calcular subtotais por moeda
  const calculateSubtotal = (transactions: Transaction[]) => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Math.max(0, t.amount_cents), 0);
    const expense = transactions
      .filter((t) => t.type === "expense" || t.type === "card_payment")
      .reduce((sum, t) => sum + Math.abs(Math.min(0, t.amount_cents)), 0);
    return { income, expense, balance: income - expense };
  };

  // Renderizar uma linha de transação
  const renderTransactionRow = (transaction: Transaction, currency: string) => {
    const account = accounts.find((a) => a.id === transaction.account_id);
    const category = categoryMap.get(transaction.category_id || 1);
    const isIncome = transaction.type === "income";
    const amount = Math.abs(transaction.amount_cents);

    return (
      <tr
        key={transaction.id}
        style={{
          borderBottom: "1px solid var(--border-color)",
          pageBreakInside: "avoid",
          breakInside: "avoid",
        }}
      >
        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
          {formatDateString(transaction.date)}
        </td>
        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
          {transaction.description || t("reports.transactions.noDescription")}
        </td>
        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
          {category?.name || t(RK.csvNoCategory)}
        </td>
        <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>
          {account?.name || "—"}
        </td>
        <td
          style={{
            padding: "0.75rem",
            fontSize: "0.875rem",
            textAlign: "right",
            fontWeight: 500,
            color: isIncome ? "var(--success)" : "var(--error)",
          }}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(amount, { currency })}
        </td>
        {currencyMode === "multi" && (
          <td style={{ padding: "0.75rem", fontSize: "0.875rem", textAlign: "center" }}>
            {currency}
          </td>
        )}
      </tr>
    );
  };

  // Renderizar lista em modo single currency
  const renderSingleCurrencyList = () => {
    const displayTransactions = exportMode
      ? sortedTransactions.slice(0, 500) // Limite para export
      : sortedTransactions.slice(0, itemsToShow);

    if (displayTransactions.length === 0) {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
          {t("reports.transactions.empty")}
        </div>
      );
    }

    return (
      <>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: exportMode ? "1rem" : "1.5rem",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.875rem" }}>
                {t("reports.transactions.table.date")}
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.875rem" }}>
                {t("reports.transactions.table.description")}
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.875rem" }}>
                {t("reports.transactions.table.category")}
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.875rem" }}>
                {t("reports.transactions.table.account")}
              </th>
              <th style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, fontSize: "0.875rem" }}>
                {t("reports.transactions.table.amount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayTransactions.map((transaction) => renderTransactionRow(transaction, selectedCurrency))}
          </tbody>
        </table>
        {!exportMode && itemsToShow < sortedTransactions.length && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setItemsToShow(itemsToShow + 20)}
            >
              {t("reports.transactions.loadMore", { n: sortedTransactions.length - itemsToShow })}
            </button>
          </div>
        )}
        {exportMode && sortedTransactions.length > 500 && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "var(--warning-light)",
              border: "1px solid var(--warning)",
              borderRadius: "8px",
              marginTop: "1rem",
              fontSize: "0.875rem",
              color: "var(--warning)",
            }}
          >
            <strong>{t(AK.common.error)}:</strong> {t("reports.transactions.exportWarning")}
          </div>
        )}
      </>
    );
  };

  // Renderizar lista em modo multi currency
  const renderMultiCurrencyList = () => {
    if (!groupedByCurrency || groupedByCurrency.size === 0) {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
          {t("reports.transactions.empty")}
        </div>
      );
    }

    const currencyArray = Array.from(groupedByCurrency.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    return (
      <>
        {currencyArray.map(([currency, currencyTransactions]) => {
          const sorted = [...currencyTransactions].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          });

          const displayTransactions = exportMode
            ? sorted.slice(0, 500) // Limite por moeda para export
            : sorted.slice(0, itemsToShow);

          const subtotal = calculateSubtotal(currencyTransactions);

          return (
            <div
              key={currency}
              style={{
                marginBottom: "2rem",
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  paddingBottom: "0.5rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                {t(RK.currency)}: {currency}
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "1rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.875rem" }}>
                      {t("reports.transactions.table.date")}
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.875rem" }}>
                      {t("reports.transactions.table.description")}
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.875rem" }}>
                      {t("reports.transactions.table.category")}
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, fontSize: "0.875rem" }}>
                      {t("reports.transactions.table.account")}
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, fontSize: "0.875rem" }}>
                      {t("reports.transactions.table.amount")}
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: 600, fontSize: "0.875rem" }}>
                      {t("reports.transactions.table.currency")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayTransactions.map((transaction) => renderTransactionRow(transaction, currency))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--border-color)", fontWeight: 600, backgroundColor: "var(--bg-secondary)" }}>
                    <td colSpan={4} style={{ padding: "0.75rem", textAlign: "right" }}>
                      {t("reports.transactions.subtotal", { currency })}:
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      {formatCurrency(subtotal.balance, { currency })}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      {currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}
        {!exportMode && itemsToShow < sortedTransactions.length && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setItemsToShow(itemsToShow + 20)}
            >
              {t("reports.transactions.loadMore", { n: sortedTransactions.length - itemsToShow })}
            </button>
          </div>
        )}
        {exportMode && sortedTransactions.length > 500 && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "var(--warning-light)",
              border: "1px solid var(--warning)",
              borderRadius: "8px",
              marginTop: "1rem",
              fontSize: "0.875rem",
              color: "var(--warning)",
            }}
          >
            <strong>{t(AK.common.error)}:</strong> {t("reports.transactions.exportWarning")}
          </div>
        )}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--info-light)",
            border: "1px solid var(--info)",
            borderRadius: "8px",
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: "var(--info)",
          }}
        >
          <strong>{t(AK.common.note)}:</strong> {t("reports.transactions.noteMultiCurrency")}
        </div>
      </>
    );
  };

  return (
    <div className="report-transactions-list" style={{ marginTop: "2rem" }}>
      <div
        style={{
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
          {t("reports.transactions.title")}
        </h2>
      </div>

      {currencyMode === "single" ? renderSingleCurrencyList() : renderMultiCurrencyList()}
    </div>
  );
}

