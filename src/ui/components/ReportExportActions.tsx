import { Download, FileText, Printer } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { RK } from "../../i18n/keys/reportsKeys";

interface ReportExportActionsProps {
  onExportPDF: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
}

export default function ReportExportActions({
  onExportPDF,
  onExportCSV,
  onPrint,
}: ReportExportActionsProps) {
  const { t } = useI18n();
  return (
    <div style={{ display: "flex", gap: "0.75rem" }}>
      <button
        className="button button-secondary"
        onClick={onExportPDF}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <FileText size={16} />
        {t(RK.exportPDF)}
      </button>
      <button
        className="button button-secondary"
        onClick={onExportCSV}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <Download size={16} />
        {t(RK.exportCSV)}
      </button>
      <button
        className="button button-secondary"
        onClick={onPrint}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <Printer size={16} />
        {t(RK.print)}
      </button>
    </div>
  );
}

