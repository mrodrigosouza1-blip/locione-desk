import { useState } from "react";
import Modal from "./Modal";
import { formatCurrency, formatDateString } from "../../utils/format";
import type { ReportData } from "../hooks/useReportsData";
import ReportsExportView from "./ReportsExportView";
import { useI18n } from "../../i18n/I18nProvider";
import { RK } from "../../i18n/keys/reportsKeys";
import { AK } from "../../i18n/keys/appKeys";

interface ReportExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "pdf" | "csv" | "print";
  reportData: ReportData;
  startDate: string;
  endDate: string;
  accountName: string | null;
  currency: string;
  onConfirm: () => void;
}

export default function ReportExportPreviewModal({
  isOpen,
  onClose,
  mode,
  reportData,
  startDate,
  endDate,
  accountName,
  currency,
  onConfirm,
}: ReportExportPreviewModalProps) {
  const { t } = useI18n();
  const [previewRows] = useState(() => {
    // Para CSV, mostrar primeiras 20 transações filtradas
    return reportData.filteredTransactions.slice(0, 20);
  });

  if (mode === "csv") {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t(RK.previewCSVTitle)}>
        <div className="modal-content" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              <strong>{t(RK.previewTotalTransactions)}:</strong> {reportData.filteredTransactions.length}
            </p>
            <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              <strong>{t(RK.previewPeriod)}:</strong> {formatDateString(startDate)} a {formatDateString(endDate)}
            </p>
            <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              <strong>{t(RK.previewAccount)}:</strong> {accountName || t(RK.allAccounts)}
            </p>
            <p style={{ color: "var(--text-secondary)" }}>
              <strong>{t(RK.previewCurrency)}:</strong> {currency === "all" ? t(RK.allCurrencies) : currency}
            </p>
          </div>

          <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                  <th style={{ padding: "0.5rem", textAlign: "left", fontWeight: 600 }}>{t(RK.csvHeaders.date)}</th>
                  <th style={{ padding: "0.5rem", textAlign: "left", fontWeight: 600 }}>{t(RK.csvHeaders.description)}</th>
                  <th style={{ padding: "0.5rem", textAlign: "left", fontWeight: 600 }}>{t(RK.csvHeaders.category)}</th>
                  <th style={{ padding: "0.5rem", textAlign: "left", fontWeight: 600 }}>{t(RK.csvHeaders.type)}</th>
                  <th style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>{t(RK.csvHeaders.amount)}</th>
                  <th style={{ padding: "0.5rem", textAlign: "left", fontWeight: 600 }}>{t(RK.csvHeaders.account)}</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((transaction) => {
                  const account = reportData.accounts.find((a) => a.id === transaction.account_id);
                  const category = reportData.categoryMap.get(transaction.category_id || 1);
                  const getTypeLabel = () => {
                    switch (transaction.type) {
                      case "income": return t(RK.csvTypeIncome);
                      case "expense": return t(RK.csvTypeExpense);
                      case "card_payment": return t(RK.csvTypeCardPayment);
                      default: return transaction.type;
                    }
                  };

                  return (
                    <tr key={transaction.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "0.5rem" }}>{formatDateString(transaction.date)}</td>
                      <td style={{ padding: "0.5rem" }}>{transaction.description || "—"}</td>
                      <td style={{ padding: "0.5rem" }}>{category?.name || t(RK.csvNoCategory)}</td>
                      <td style={{ padding: "0.5rem" }}>{getTypeLabel()}</td>
                      <td style={{ padding: "0.5rem", textAlign: "right" }}>
                        {formatCurrency(transaction.amount_cents, { currency: account?.currency_code || currency })}
                      </td>
                      <td style={{ padding: "0.5rem" }}>{account?.name || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {reportData.filteredTransactions.length > 20 && (
              <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {t(RK.previewMoreTransactions, { n: reportData.filteredTransactions.length - 20 })}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button className="button button-secondary" onClick={onClose}>
              {t(AK.common.cancel)}
            </button>
            <button className="button button-primary" onClick={onConfirm}>
              {t(RK.previewDownloadCSV)}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Preview para PDF/Print - usar componente ReportsExportView
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(RK.previewTitle)}>
      <div className="modal-content" style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <div id="report-print-layout" style={{ padding: "1rem", backgroundColor: "white" }}>
          <ReportsExportView
            data={reportData}
            startDate={startDate}
            endDate={endDate}
            accountName={accountName}
            currency={currency}
            exportMode={true}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button className="button button-secondary" onClick={onClose}>
            {t(AK.common.cancel)}
          </button>
          <button className="button button-primary" onClick={onConfirm}>
            {mode === "print" ? t(RK.previewOpenPrint) : t(RK.previewDownloadPDF)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

