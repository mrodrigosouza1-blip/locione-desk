import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { goalRepository } from "../../infra/repositories/goalRepository";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { formatMoney } from "../../utils/format";
import Topbar from "../components/Topbar";
import MoneyInput from "../components/MoneyInput";
import CurrencySelect from "../components/CurrencySelect";
import MonthMultiSelect from "../components/MonthMultiSelect";
import RadioGroup from "../components/RadioGroup";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { useToast } from "../hooks/useToast";
import { GK } from "../../i18n/keys/goalsKeys";
import { AK } from "../../i18n/keys/appKeys";

type GoalType = "free" | "steps" | "monthly";
type Mode = "fixed" | "by_number";

export default function GoalNewWizardPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [settings] = useState(() => {
    try {
      return settingsRepository.get();
    } catch {
      return { currency: "BRL", date_format: "DD/MM/YYYY", theme: "light" as const };
    }
  });

  // Etapa 1: Tipo
  const [goalType, setGoalType] = useState<GoalType | "">("");

  // Etapa 2: Dados principais
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState(settings.currency);
  const [targetValueCents, setTargetValueCents] = useState(0);

  // Etapa 3: Configurações
  const [stepsTotal, setStepsTotal] = useState<number | "custom">(25);
  const [customStepsTotal, setCustomStepsTotal] = useState(25);
  const [mode, setMode] = useState<Mode>("fixed");
  const [fixedAmountCents, setFixedAmountCents] = useState(0);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

  // Validações
  const isStep1Valid = goalType !== "";
  const isStep2Valid = name.trim().length >= 2 && currencyCode !== "" && targetValueCents > 0;
  const isStep3Valid = (() => {
    if (goalType === "free") return true;
    if (goalType === "steps") {
      const total = stepsTotal === "custom" ? customStepsTotal : stepsTotal;
      if (total < 1) return false;
      if (mode === "fixed" && fixedAmountCents <= 0) return false;
      return true;
    }
    if (goalType === "monthly") {
      if (selectedMonths.length === 0) return false;
      if (mode === "fixed" && fixedAmountCents <= 0) return false;
      return true;
    }
    return false;
  })();

  // Exemplo dinâmico
  const getExampleText = () => {
    if (goalType === "steps" && mode === "fixed" && fixedAmountCents > 0) {
      return `${t(GK.steps.example)}: ${formatMoney(fixedAmountCents, currencyCode)}`;
    }
    if (goalType === "steps" && mode === "by_number") {
      return `${t(GK.steps.example)}: ${formatMoney(10 * 100, currencyCode)}`;
    }
    if (goalType === "monthly" && mode === "fixed" && fixedAmountCents > 0) {
      return `${t(GK.monthly.example)}: ${formatMoney(fixedAmountCents, currencyCode)}`;
    }
    if (goalType === "monthly" && mode === "by_number") {
      return `${t(GK.monthly.example)}: ${formatMoney(8 * 100, currencyCode)}`;
    }
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isStep3Valid || !goalType) return;

    try {
      const config: any = {};
      
      if (goalType === "steps") {
        config.steps_total = stepsTotal === "custom" ? customStepsTotal : stepsTotal;
        config.mode = mode;
        if (mode === "fixed") {
          config.fixed_amount_cents = fixedAmountCents;
        }
      } else if (goalType === "monthly") {
        config.months_selected = selectedMonths;
        config.mode = mode;
        if (mode === "fixed") {
          config.fixed_amount_cents = fixedAmountCents;
        }
      }

      // Mapear contributionMode ("free"|"steps"|"monthly") para DTO type ("target"|"deadline")
      // Por enquanto, sempre usar "target" (sem deadline)
      // TODO: Adicionar suporte a deadline quando necessário
      await goalRepository.create({
        name: name.trim(),
        type: "target", // Sempre "target" para metas sem deadline
        currency_code: currencyCode,
        target_value_cents: targetValueCents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      toast.success(t(GK.messages.createSuccess) || "Meta criada com sucesso");

      // Navegar de volta para lista de metas (a meta criada aparecerá no topo)
      navigate("/goals");
    } catch (error: any) {
      const msg = error instanceof Error && error.message ? error.message : t(GK.messages.createError);
      toast.error(msg);
    }
  }

  return (
    <>
      <Topbar
        title={t(GK.wizard.title)}
        subtitle={t(GK.wizard.step, { step })}
        secondaryAction={{
          label: t(AK.common.back),
          onClick: () => navigate("/goals"),
          icon: <ArrowLeft size={16} />,
          variant: "secondary",
        }}
        showLockNow={true}
      />
      <div className="content-area">

        <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); }}>
            {/* ETAPA 1: Tipo */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                  {t(GK.wizard.step1Title)}
                </h2>
                <RadioGroup
                  name="goalType"
                  label=""
                  value={goalType}
                  onChange={(value) => setGoalType(value as GoalType)}
                  options={[
                    {
                      value: "steps",
                      label: t(GK.types.steps),
                      description: t(GK.wizard.typeDescription.steps),
                    },
                    {
                      value: "monthly",
                      label: t(GK.types.monthly),
                      description: t(GK.wizard.typeDescription.monthly),
                    },
                    {
                      value: "free",
                      label: t(GK.types.free),
                      description: t(GK.wizard.typeDescription.free),
                    },
                  ]}
                  required
                />
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/goals")}
                  >
                    {t(GK.actions.cancel)}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                  >
                    {t(GK.actions.continue)}
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: Dados principais */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                  {t(GK.wizard.step2Title)}
                </h2>
                <div className="form-group">
                  <label className="label">{t(GK.fields.name)}</label>
                  <input
                    className="input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t(GK.fields.namePlaceholder)}
                    required
                    minLength={2}
                  />
                  {name.trim().length > 0 && name.trim().length < 2 && (
                    <p style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.25rem" }}>
                      {t(GK.wizard.nameMinLength)}
                    </p>
                  )}
                </div>

                <CurrencySelect
                  label={t(GK.fields.currency)}
                  value={currencyCode}
                  onChange={setCurrencyCode}
                  required
                />

                <MoneyInput
                  label={t(GK.fields.targetValue)}
                  value={targetValueCents}
                  onChange={setTargetValueCents}
                  currencyCode={currencyCode}
                  required
                  min={1}
                />
                {targetValueCents <= 0 && (
                  <p style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "-0.75rem", marginBottom: "1rem" }}>
                    {t(GK.wizard.valueMustBePositive)}
                  </p>
                )}

                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                  >
                    {t(GK.actions.back)}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setStep(3)}
                    disabled={!isStep2Valid}
                  >
                    {t(GK.actions.continue)}
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: Configurações */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                  {t(GK.wizard.step3Title)}
                </h2>

                {goalType === "free" && (
                  <div>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                      {t(GK.free.description)}
                    </p>
                  </div>
                )}

                {goalType === "steps" && (
                  <div>
                    <div className="form-group">
                      <label className="label">{t(GK.steps.totalSteps)}</label>
                      <select
                        className="input"
                        value={stepsTotal}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setStepsTotal("custom");
                          } else {
                            setStepsTotal(parseInt(e.target.value));
                            setCustomStepsTotal(parseInt(e.target.value));
                          }
                        }}
                        required
                      >
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="75">75</option>
                        <option value="100">100</option>
                        <option value="150">150</option>
                        <option value="200">200</option>
                        <option value="300">300</option>
                        <option value="365">365</option>
                        <option value="custom">{t(GK.wizard.customSteps)}</option>
                      </select>
                    </div>

                    {stepsTotal === "custom" && (
                      <div className="form-group">
                        <label className="label">{t(GK.wizard.customStepsLabel)}</label>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          value={customStepsTotal}
                          onChange={(e) => setCustomStepsTotal(parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>
                    )}

                    <RadioGroup
                      name="mode"
                      label={t(GK.wizard.howToCalculate)}
                      value={mode}
                      onChange={(value) => setMode(value as Mode)}
                      options={[
                        {
                          value: "fixed",
                          label: t(GK.steps.fixedPerStep),
                        },
                        {
                          value: "by_number",
                          label: t(GK.wizard.valueEqualsStepNumber),
                          description: t(GK.wizard.valueEqualsStepNumberDesc),
                        },
                      ]}
                      required
                    />

                    {mode === "fixed" && (
                      <div>
                        <MoneyInput
                          label={t(GK.steps.valuePerStep)}
                          value={fixedAmountCents}
                          onChange={setFixedAmountCents}
                          currencyCode={currencyCode}
                          required
                          min={1}
                        />
                        {fixedAmountCents <= 0 && (
                          <p style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "-0.75rem", marginBottom: "1rem" }}>
                            {t(GK.wizard.valueMustBePositive)}
                          </p>
                        )}
                      </div>
                    )}

                    {getExampleText() && (
                      <div style={{
                        padding: "0.75rem",
                        background: "var(--bg-secondary)",
                        borderRadius: "8px",
                        marginTop: "1rem",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                      }}>
                        {getExampleText()}
                      </div>
                    )}
                  </div>
                )}

                {goalType === "monthly" && (
                  <div>
                    <MonthMultiSelect
                      label={t(GK.wizard.monthsIncluded)}
                      selectedMonths={selectedMonths}
                      onChange={setSelectedMonths}
                      required
                    />

                    <RadioGroup
                      name="mode"
                      label={t(GK.wizard.howToCalculate)}
                      value={mode}
                      onChange={(value) => setMode(value as Mode)}
                      options={[
                        {
                          value: "fixed",
                          label: t(GK.monthly.fixedPerDay),
                        },
                        {
                          value: "by_number",
                          label: t(GK.wizard.valueEqualsDayNumber),
                          description: t(GK.wizard.valueEqualsDayNumberDesc),
                        },
                      ]}
                      required
                    />

                    {mode === "fixed" && (
                      <div>
                        <MoneyInput
                          label={t(GK.monthly.valuePerDay)}
                          value={fixedAmountCents}
                          onChange={setFixedAmountCents}
                          currencyCode={currencyCode}
                          required
                          min={1}
                        />
                        {fixedAmountCents <= 0 && (
                          <p style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "-0.75rem", marginBottom: "1rem" }}>
                            {t(GK.wizard.valueMustBePositive)}
                          </p>
                        )}
                      </div>
                    )}

                    {getExampleText() && (
                      <div style={{
                        padding: "0.75rem",
                        background: "var(--bg-secondary)",
                        borderRadius: "8px",
                        marginTop: "1rem",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                      }}>
                        {getExampleText()}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(2)}
                  >
                    {t(GK.actions.back)}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!isStep3Valid}
                  >
                    {t(GK.wizard.createGoal)}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

