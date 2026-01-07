import { formatDateString, formatCurrency } from "../../utils/format";
import type { ReportData } from "../hooks/useReportsData";
import ReportSummaryCards from "./ReportSummaryCards";
import BalanceLineChart from "./BalanceLineChart";
import CategoryPieChart from "./CategoryPieChart";
import InOutBarChart from "./InOutBarChart";
import ReportInsights from "./ReportInsights";
import ReportTransactionsList from "./ReportTransactionsList";
import { useI18n } from "../../i18n/I18nProvider";
import { RK } from "../../i18n/keys/reportsKeys";
import { AK } from "../../i18n/keys/appKeys";

interface ReportsExportViewProps {
  data: ReportData;
  startDate: string;
  endDate: string;
  accountName: string | null;
  currency: string;
  exportMode?: boolean; // true para modo export/print
}

export default function ReportsExportView({
  data,
  startDate,
  endDate,
  accountName,
  currency,
  exportMode = false,
}: ReportsExportViewProps) {
  const { t } = useI18n();
  const effectiveCurrency = currency === "MULTI" ? "BRL" : currency;

  return (
    <div 
      className={exportMode ? "reports-export-view" : ""}
      style={exportMode ? { 
        height: "auto", 
        maxHeight: "none", 
        overflow: "visible",
        width: "100%"
      } : {}}
    >
      {/* Cabeçalho */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: exportMode ? "1.5rem" : "1.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          {t(RK.financialReport)}
        </h1>
        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>{t(RK.reportPeriod)}:</strong> {formatDateString(startDate)} a {formatDateString(endDate)}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>{t(RK.reportAccount)}:</strong> {accountName || t(RK.allAccounts)}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>{t(RK.reportCurrency)}:</strong> {currency === "MULTI" ? t(RK.allCurrencies) : currency}
          </p>
        </div>
      </div>

      {/* Aviso quando "Todas as moedas" está ativo */}
      {data.selectedCurrency === "all" && !exportMode && (
        <div
          className="card"
          style={{
            marginBottom: "2rem",
            backgroundColor: "var(--warning-light)",
            border: "1px solid var(--warning)",
          }}
        >
          <p style={{ color: "var(--warning)", margin: 0 }}>
            <strong>{t(AK.common.error)}:</strong> {t(RK.multiCurrencyWarning)}
          </p>
        </div>
      )}

      {/* Cards de Resumo */}
      <ReportSummaryCards
        totalIncome={data.totalIncome}
        totalExpense={data.totalExpense}
        balance={data.balance}
        balanceVariation={data.balanceVariation}
        balanceVariationPercent={data.balanceVariationPercent}
        availableBalance={data.availableBalance}
        currency={effectiveCurrency}
        ui={data.ui}
      />

      {/* Gráficos */}
      <div className="grid grid-2" style={{ marginBottom: "2rem" }}>
        <BalanceLineChart data={data.dailyBalance} currency={effectiveCurrency} />
        <CategoryPieChart data={data.expensesByCategory} currency={effectiveCurrency} />
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <InOutBarChart
          totalIncome={data.totalIncome}
          totalExpense={data.totalExpense}
          currency={effectiveCurrency}
        />
      </div>

      {/* Análise Inteligente */}
      <ReportInsights
        expensesByCategory={data.expensesByCategory}
        totalExpense={data.totalExpense}
        balance={data.balance}
        balanceVariation={data.balanceVariation}
        balanceVariationPercent={data.balanceVariationPercent}
        currency={effectiveCurrency}
      />

      {/* Tabela resumo de categorias (sempre visível no export, também no modo normal) */}
      {data.expensesByCategory.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>{t("reports.exportView.expensesByCategory")}</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                <th style={{ padding: "0.5rem", textAlign: "left", fontWeight: 600 }}>{t(RK.csvHeaders.category)}</th>
                <th style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>{t(RK.csvHeaders.amount)}</th>
                <th style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>%</th>
              </tr>
            </thead>
            <tbody>
              {data.expensesByCategory.map((item) => (
                <tr key={item.categoryId} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "0.5rem" }}>{item.categoryName}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>
                    {formatCurrency(item.amount, { currency: effectiveCurrency })}
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{item.percent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista de Lançamentos */}
      <ReportTransactionsList
        transactions={data.filteredTransactions}
        accounts={data.accounts}
        categoryMap={data.categoryMap}
        currencyMode={data.currencyMode}
        selectedCurrency={data.selectedCurrency === "all" ? "BRL" : data.selectedCurrency}
        exportMode={exportMode}
      />

      {/* Total de transações */}
      <div style={{ marginTop: "2rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
        <p>{t("reports.exportView.totalTransactions")}: {data.transactions.length}</p>
      </div>
    </div>
  );
}

