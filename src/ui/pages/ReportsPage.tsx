import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Topbar, { type TopbarPeriod } from "../components/Topbar";
import { useReportsData, type ReportFilters } from "../hooks/useReportsData";
import ReportPeriodSelector from "../components/ReportPeriodSelector";
import ReportExportPreviewModal from "../components/ReportExportPreviewModal";
import ReportsExportView from "../components/ReportsExportView";
import { formatDateString } from "../../utils/format";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import MoneyDisplay from "../components/MoneyDisplay";
import { createReportExportHTML, getExportCSS, cloneExportDOM } from "../../utils/exportUtils";
import { useI18n } from "../../i18n/I18nProvider";
import { RK } from "../../i18n/keys/reportsKeys";
import { AK } from "../../i18n/keys/appKeys";
import { useToast } from "../hooks/useToast";
import { logger } from "../../utils/logger";
import { FileText } from "lucide-react";
import { getUsageCounters } from "../../services/usageCounters";
import { checkGate } from "../../services/planGate";
import { requireGate } from "../../services/requireGate";
import PremiumTag from "../components/PremiumTag";
import EmptyState from "../../shared/components/EmptyState";
import { illustrations } from "../../assets/illustrations";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  
  // Preview Premium: FREE pode ver relatórios, mas ações premium são bloqueadas
  const counters = getUsageCounters();
  const gateResult = checkGate("reports.access", counters);
  const isReportsPremium = gateResult.ok;
  const [filters, setFilters] = useState<ReportFilters>({
    period: "current_month",
    movementFilter: "all",
  });

  const { data, loading, startDate, endDate } = useReportsData(filters);
  const [fullSettings] = useState(() => {
    try {
      return settingsRepository.getSettings();
    } catch {
      return null;
    }
  });
  
  // Null-safety para estados de loading
  const isLoading = loading ?? false;
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    mode: "pdf" | "csv" | "print";
  }>({ isOpen: false, mode: "pdf" });
  const exportRef = useRef<HTMLDivElement>(null);

  // Obter nome da conta selecionada
  const accountName = filters.accountId
    ? data.accounts.find((a) => a.id === filters.accountId)?.name || null
    : null;

  // Moeda efetiva (da conta ou selecionada)
  const effectiveCurrency = data.selectedCurrency === "all" ? "MULTI" : data.selectedCurrency;

  // Mapear período do ReportFilters para TopbarPeriod
  const mapPeriodToTopbar = (period: string): TopbarPeriod => {
    switch (period) {
      case "current_month":
      case "last_month":
        return "month";
      case "last_3_months":
        return "last30Days";
      case "last_6_months":
        return "last30Days";
      case "custom":
        return "custom";
      default:
        return "month";
    }
  };

  const topbarPeriod = mapPeriodToTopbar(filters.period || "current_month");

  const handleTopbarPeriodChange = (p: TopbarPeriod) => {
    // Mapear de volta para ReportFilters
    let newPeriod: ReportFilters["period"] = "current_month";
    switch (p) {
      case "month":
        newPeriod = "current_month";
        break;
      case "last7Days":
      case "last15Days":
      case "last30Days":
        newPeriod = "custom";
        // Calcular datas baseado no período
        const days = p === "last7Days" ? 7 : p === "last15Days" ? 15 : 30;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        setFilters({
          ...filters,
          period: "custom",
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        });
        return;
      case "custom":
        newPeriod = "custom";
        break;
    }
    setFilters({ ...filters, period: newPeriod });
  };

  // Abrir preview antes de exportar
  function handleExportPDF() {
    if (!isReportsPremium) {
      const counters = getUsageCounters();
      requireGate("reports.access", counters, toast, undefined, t); // Não navegar automaticamente
      return;
    }
    setPreviewModal({ isOpen: true, mode: "pdf" });
  }

  function handleExportCSV() {
    // CSV não está bloqueado no FREE
    setPreviewModal({ isOpen: true, mode: "csv" });
  }

  function handlePrint() {
    if (!isReportsPremium) {
      const counters = getUsageCounters();
      requireGate("reports.access", counters, toast, undefined, t); // Não navegar automaticamente
      return;
    }
    setPreviewModal({ isOpen: true, mode: "print" });
  }

  // Confirmar exportação após preview
  function confirmExport() {
    if (previewModal.mode === "csv") {
      exportToCSV();
    } else if (previewModal.mode === "pdf") {
      exportToPDF();
    } else if (previewModal.mode === "print") {
      doPrint();
    }
    setPreviewModal({ isOpen: false, mode: "pdf" });
  }

  // Exportar CSV
  function exportToCSV() {
    // REGRA CRÍTICA: Usar filteredTransactions (já filtrado por movimento e sem cartão)
    // Limitar a 5000 transações para evitar problemas de performance
    const transactionsToExport = data.filteredTransactions.slice(0, 5000);

    const headers = [
      t(RK.csvHeaders.date),
      t(RK.csvHeaders.type),
      t(RK.csvHeaders.description),
      t(RK.csvHeaders.category),
      t(RK.csvHeaders.amount),
      t(RK.csvHeaders.account),
      t(RK.csvHeaders.currency),
    ];
    const rows = transactionsToExport.map((transaction) => {
      const account = data.accounts.find((a) => a.id === transaction.account_id);
      const currency = account?.currency_code || effectiveCurrency;
      const getTypeLabel = () => {
        switch (transaction.type) {
          case "income": return t(RK.csvTypeIncome);
          case "expense": return t(RK.csvTypeExpense);
          case "card_payment": return t(RK.csvTypeCardPayment);
          default: return transaction.type;
        }
      };
      return [
        formatDateString(transaction.date),
        getTypeLabel(),
        transaction.description || "",
        data.categoryMap.get(transaction.category_id || 1)?.name || t(RK.csvNoCategory),
        (transaction.amount_cents / 100).toFixed(2).replace(".", ","),
        account?.name || "",
        currency,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = `relatorio_${startDate}_${endDate}_${effectiveCurrency}${accountName ? `_${accountName.replace(/\s+/g, "_")}` : ""}.csv`;
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Aviso se houver limite
    if (data.filteredTransactions.length > 5000) {
      toast.warning(t(RK.csvExportWarning, { n: data.filteredTransactions.length }));
    }
  }

  // Exportar PDF (usando print-to-PDF com DOM clonado)
  async function exportToPDF() {
    if (!exportRef.current) {
      logger.errorTag("ReportsPage", "Export ref não disponível");
      toast.error(t(AK.common.error));
      return;
    }

    try {
      // Clonar o DOM do exportRef (mesmo conteúdo do preview)
      const bodyHtml = await cloneExportDOM(exportRef.current);
      
      // Obter CSS completo
      const cssText = getExportCSS();
      
      // Criar HTML completo
      const htmlContent = createReportExportHTML(
        t(RK.financialReport),
        bodyHtml,
        cssText
      );

      // Criar janela temporária com o conteúdo
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        logger.errorTag("ReportsPage", "Não foi possível abrir janela de impressão");
        toast.error(t(AK.common.error));
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Aguardar carregamento completo antes de imprimir
      printWindow.onload = () => {
        // Aguardar mais um pouco para garantir que tudo está renderizado
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } catch (error) {
      logger.errorTag("ReportsPage", "Erro ao exportar PDF:", error);
      toast.error(t(AK.common.error));
    }
  }

  // Imprimir
  function doPrint() {
    window.print();
  }


  if (isLoading) {
    return (
      <>
        <Topbar
          title={t(RK.title)}
          subtitle={t(RK.subtitle)}
          primaryAction={{
            label: t(AK.common.export),
            onClick: handleExportPDF,
            icon: <FileText size={16} />,
            variant: "primary",
          }}
          showPeriodSelect={true}
          period={topbarPeriod}
          onPeriodChange={handleTopbarPeriodChange}
          showLockNow={true}
        />
        <div className="content-area">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <div>{t(RK.loading)}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={t(RK.title)}
        subtitle={t(RK.subtitle)}
        primaryAction={{
          label: (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {t(AK.common.export)}
              {!isReportsPremium && (
                <PremiumTag title={t("gate.reports.viewOnly")} />
              )}
            </span>
          ),
          onClick: handleExportPDF,
          icon: <FileText size={16} />,
          variant: "primary",
          disabled: !isReportsPremium,
          title: !isReportsPremium ? t("gate.reports.viewOnly") : undefined,
        }}
        menuItems={[
          {
            label: t(RK.exportCSV),
            onClick: handleExportCSV,
          },
          {
            label: (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {t(RK.print)}
                {!isReportsPremium && (
                  <PremiumTag title={t("gate.reports.viewOnly")} />
                )}
              </span>
            ),
            onClick: handlePrint,
            disabled: !isReportsPremium,
            title: !isReportsPremium ? t("gate.reports.viewOnly") : undefined,
          },
        ]}
        showPeriodSelect={true}
        period={topbarPeriod}
        onPeriodChange={handleTopbarPeriodChange}
        showLockNow={true}
      />
      <div className="content-area">
        {/* Resumo Visual do Período */}
        <div
          className="card"
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <BarChart3 size={20} />
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              {t(RK.period)}: {formatDateString(startDate)} a {formatDateString(endDate)}
            </h3>
          </div>
          <div className="grid grid-3" style={{ gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                {t("reports.summary.totalIncome")}
              </div>
              <MoneyDisplay
                amountCents={data.totalIncome}
                currencyCode={data.selectedCurrency === "all" ? "BRL" : data.selectedCurrency}
                settings={fullSettings}
                primaryStyle={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--success)" }}
              />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                {t("reports.summary.totalExpense")}
              </div>
              <MoneyDisplay
                amountCents={data.totalExpense}
                currencyCode={data.selectedCurrency === "all" ? "BRL" : data.selectedCurrency}
                settings={fullSettings}
                primaryStyle={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--error)" }}
              />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                {t("reports.summary.balance")}
              </div>
              <MoneyDisplay
                amountCents={data.balance}
                currencyCode={data.selectedCurrency === "all" ? "BRL" : data.selectedCurrency}
                settings={fullSettings}
                primaryStyle={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: data.balance >= 0 ? "var(--success)" : "var(--error)",
                }}
              />
            </div>
          </div>
          {accountName && (
            <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {t(RK.account)}: <strong>{accountName}</strong>
            </div>
          )}
        </div>

        {/* Filtros */}
        <ReportPeriodSelector
          filters={filters}
          onFiltersChange={setFilters}
          isPremium={isReportsPremium}
        />

        {/* Conteúdo do Relatório ou Empty State */}
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            Carregando...
          </div>
        ) : !data || !data.filteredTransactions || data.filteredTransactions.length === 0 ? (
          <EmptyState
            image={illustrations.empty.search}
            title={t(RK.emptyTitle)}
            description={t(RK.emptyMessage)}
            action={
              <button 
                className="btn btn-primary"
                onClick={() => navigate("/transactions")}
              >
                <BarChart3 size={16} />
                {t(RK.emptyCta)}
              </button>
            }
          />
        ) : (
          <div ref={exportRef} id="report-export-root">
            <ReportsExportView
              data={data}
              startDate={startDate}
              endDate={endDate}
              accountName={accountName}
              currency={data.selectedCurrency === "all" ? "MULTI" : data.selectedCurrency}
              exportMode={false}
            />
          </div>
        )}
      </div>

      {/* Modal de Preview */}
      <ReportExportPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, mode: "pdf" })}
        mode={previewModal.mode}
        reportData={data}
        startDate={startDate}
        endDate={endDate}
        accountName={accountName}
        currency={effectiveCurrency}
        onConfirm={confirmExport}
      />

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          .sidebar,
          .topbar,
          .page-header,
          .page-header button,
          .modal-overlay,
          .no-print {
            display: none !important;
          }
          .content-area {
            margin: 0 !important;
            padding: 1rem !important;
          }
          #report-export-root {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .card {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 1rem;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            height: auto !important;
            max-height: none !important;
          }
          .grid {
            page-break-inside: avoid;
            break-inside: avoid;
            height: auto !important;
            max-height: none !important;
          }
          svg {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            visibility: visible !important;
          }
          /* Garantir que gráficos SVG apareçam */
          .card svg {
            page-break-inside: avoid;
            break-inside: avoid;
            display: block !important;
            visibility: visible !important;
          }
          /* Ajustar cores para impressão */
          body {
            background: white !important;
            color: black !important;
          }
          /* Evitar quebra de página em elementos importantes */
          h1, h2 {
            page-break-after: avoid;
          }
          table {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Lista de lançamentos - evitar quebra de página em linhas */
          .report-transactions-list table tbody tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Agrupamento por moeda - evitar quebra entre grupos */
          .report-transactions-list > div {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Tabelas de lançamentos - permitir quebra apenas entre grupos */
          .report-transactions-list table {
            page-break-inside: auto;
          }
          .report-transactions-list table thead {
            display: table-header-group;
          }
          .report-transactions-list table tbody {
            display: table-row-group;
          }
        }
      `}</style>
    </>
  );
}
