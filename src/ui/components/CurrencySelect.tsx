import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";

interface CurrencySelectProps {
  label: string;
  value: string;
  onChange: (currency: string) => void;
  required?: boolean;
}

const CURRENCIES = [
  { code: "BRL", name: "Real Brasileiro (BRL)" },
  { code: "EUR", name: "Euro (EUR)" },
  { code: "USD", name: "Dólar Americano (USD)" },
  { code: "GBP", name: "Libra Esterlina (GBP)" },
  { code: "JPY", name: "Iene Japonês (JPY)" },
];

export default function CurrencySelect({
  label,
  value,
  onChange,
  required,
}: CurrencySelectProps) {
  const { t } = useI18n();
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{t(AK.currencySelect.placeholder)}</option>
        {CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
}

