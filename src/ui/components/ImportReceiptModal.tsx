import { useState, useEffect } from "react";
import { parseReceiptFile, type ExtractedItem } from "../../domain/import/receiptParser";
import { suggestCategory } from "../../domain/categories/categorySuggester";
import { accountRepository } from "../../infra/repositories/accountRepository";
import { creditCardRepository } from "../../infra/repositories/creditCardRepository";
import { transactionRepository } from "../../infra/repositories/transactionRepository";
import { categoryRepository } from "../../infra/repositories/categoryRepository";
import { settingsRepository } from "../../infra/repositories/settingsRepository";
import { formatMoney } from "../../utils/format";
import { useI18n } from "../../i18n/I18nProvider";
import { AK } from "../../i18n/keys/appKeys";
import { TX } from "../../i18n/keys/transactionsKeys";
import { IRK } from "../../i18n/keys/importReceiptKeys";
import { RK } from "../../i18n/keys/reportsKeys";
import Modal from "./Modal";
import DatePicker from "./DatePicker";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { cleanMoneyInput, formatMoneyInput, getMoneyPlaceholder, parseMoneyInput } from "../utils/moneyInput";

interface ImportReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type DestinationType = "account" | "card";

export default function ImportReceiptModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportReceiptModalProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<"select" | "preview" | "success">("select");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [selectedAmountIndex, setSelectedAmountIndex] = useState<number | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editedItems, setEditedItems] = useState<Map<string, Partial<ExtractedItem>>>(new Map());

  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
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
  const [formData, setFormData] = useState({
    amount_cents: 0,
    date: new Date().toISOString().split("T")[0],
    competence_month: new Date().toISOString().slice(0, 7),
    description: "",
    category_id: 1,
    type: "expense" as "expense" | "income",
    destination_type: "account" as DestinationType,
    destination_id: 0,
    installments: 1,
  });
  const locale = fullSettings?.preferences.locale ?? "pt-BR";
  const destinationCurrency =
    (formData.destination_type === "account"
      ? accounts.find((account) => account.id === formData.destination_id)?.currency_code
      : cards.find((card) => card.id === formData.destination_id)?.currency_code) || settings.currency;

  useEffect(() => {
    if (isOpen) {
      loadData().then(() => {
        resetForm();
      });
    }
  }, [isOpen]);

  useEffect(() => {
    // Atualizar destination_id quando accounts/cards mudarem
    if (accounts.length > 0 && formData.destination_type === "account" && formData.destination_id === 0) {
      setFormData((prev) => ({
        ...prev,
        destination_id: accounts[0].id,
      }));
    }
    if (cards.length > 0 && formData.destination_type === "card" && formData.destination_id === 0) {
      setFormData((prev) => ({
        ...prev,
        destination_id: cards[0].id,
      }));
    }
  }, [accounts, cards]);

  async function loadData() {
    const accountsList = await accountRepository.findAll();
    const cardsList = await creditCardRepository.findAll();
    const categoriesList = await categoryRepository.findAll();
    
    setAccounts(accountsList);
    setCards(cardsList);
    setCategories(categoriesList);
    
    // Se houver contas, selecionar a primeira
    if (accountsList.length > 0 && formData.destination_id === 0) {
      setFormData((prev) => ({
        ...prev,
        destination_id: accountsList[0].id,
      }));
    }
  }

  function resetForm() {
    setStep("select");
    setSelectedFile(null);
    setError(null);
    setParsedData(null);
    setShowTextPreview(false);
    setSelectedAmountIndex(null);
    setSelectedDateIndex(null);
    setSelectedItems(new Set());
    setEditedItems(new Map());
    // Usar valores atuais de accounts/categories que já foram carregados
    const defaultAccountId = accounts.length > 0 ? accounts[0].id : 0;
    const defaultCategoryId = categories.length > 0 ? categories[0].id : 1;
    setFormData({
      amount_cents: 0,
      date: new Date().toISOString().split("T")[0],
      competence_month: new Date().toISOString().slice(0, 7),
      description: "",
      category_id: defaultCategoryId,
      type: "expense",
      destination_type: "account",
      destination_id: defaultAccountId,
      installments: 1,
    });
  }

  async function handleSelectFile() {
    try {
      setIsLoading(true);
      setError(null);

      const files = await (window as any).locione.dialog.open({
        filters: [
          {
            name: "Arquivos de Recibo",
            extensions: ["pdf", "png", "jpg", "jpeg", "txt", "csv"],
          },
        ],
        multiple: false,
      });

      if (!files || files.length === 0) {
        setIsLoading(false);
        return;
      }

      const file = files[0];
      setSelectedFile(file);
      const fileName = file.split(/[\\/]/).pop() || "";
      const extension = fileName.split(".").pop()?.toLowerCase() || "";

      // Determinar MIME type
      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        txt: "text/plain",
        csv: "text/csv",
      };
      const detectedMime = mimeTypes[extension] || "application/octet-stream";

      // Ler arquivo se for texto
      if (extension === "txt" || extension === "csv") {
        try {
          const content = await (window as any).locione.fs.readTextFile(file);
          const parsed = await parseReceiptFile(content, detectedMime, file);
          setParsedData(parsed);
          await fillFormFromParsed(parsed);
        } catch (err) {
          setError(t(IRK.errors.fileReadError));
        }
      } else if (extension === "pdf") {
        // Para PDF, tentar ler como texto (pode não funcionar para PDFs escaneados)
        try {
          const content = await (window as any).locione.fs.readTextFile(file);
          const parsed = await parseReceiptFile(content, detectedMime, file);
          setParsedData(parsed);
          if (parsed.extractedText.length === 0) {
            setError(t(IRK.errors.pdfNoText));
          } else {
            await fillFormFromParsed(parsed);
          }
        } catch (err) {
          setError(
            "Não foi possível ler o texto automaticamente. Preencha os campos manualmente."
          );
          setParsedData({
            confidence: "none",
            amountCandidates: [],
            dateCandidates: [],
            extractedText: "",
          });
        }
      } else {
        setError(
          "Leitura automática limitada para imagens. Preencha os campos manualmente."
        );
        setParsedData({
          confidence: "none",
          amountCandidates: [],
          dateCandidates: [],
          extractedText: "",
        });
      }

      setStep("preview");
    } catch (err: any) {
      setError(err.message || t(IRK.errors.fileSelectError));
    } finally {
      setIsLoading(false);
    }
  }

  async function fillFormFromParsed(parsed: any) {
    // Se for extrato (múltiplos itens), adicionar sugestões de categoria
    if (parsed.items && parsed.items.length > 0) {
      for (const item of parsed.items) {
        if (item.description) {
          const suggestion = await suggestCategory({
            description: item.description,
            merchant: item.description,
            amount_cents: item.amount_cents,
          });
          item.category_suggestion = suggestion;
        }
      }
      
      // Selecionar todos os itens por padrão
      setSelectedItems(new Set(parsed.items.map((item: ExtractedItem) => item.id)));
    }

    // Selecionar melhor palpite automaticamente (modo simples)
    const bestAmount = parsed.amountCandidates?.[0];
    const bestDate = parsed.dateCandidates?.[0];

    setSelectedAmountIndex(bestAmount ? 0 : null);
    setSelectedDateIndex(bestDate ? 0 : null);

    setFormData((prev) => ({
      ...prev,
      amount_cents: bestAmount?.cents || prev.amount_cents,
      date: bestDate?.date || prev.date,
      competence_month: bestDate?.date
        ? bestDate.date.slice(0, 7)
        : prev.competence_month,
      description: parsed.description || prev.description,
    }));
  }

  async function handleSave() {
    try {
      setIsLoading(true);
      setError(null);

      if (!formData.destination_id) {
        setError(t(IRK.errors.noDestination));
        setIsLoading(false);
        return;
      }

      // Modo lote: salvar múltiplos itens selecionados
      if (parsedData?.items && parsedData.items.length > 0 && selectedItems.size > 0) {
        const itemsToSave = parsedData.items.filter((item: ExtractedItem) =>
          selectedItems.has(item.id)
        );

        if (itemsToSave.length === 0) {
          setError(t(IRK.errors.noItemsSelected));
          setIsLoading(false);
          return;
        }

        // Validar limite se for cartão
        if (formData.destination_type === "card") {
          const card = await creditCardRepository.findById(formData.destination_id);
          if (!card) {
            setError(t(IRK.errors.cardNotFound));
            setIsLoading(false);
            return;
          }

          const totalAmount = itemsToSave.reduce(
            (sum: number, item: ExtractedItem) => sum + (item.amount_cents || 0),
            0
          );

          if (card.limit_available_cents < totalAmount) {
            setError(t(IRK.errors.insufficientLimit));
            setIsLoading(false);
            return;
          }
        }

        // Salvar cada item
        for (const item of itemsToSave) {
          const edited = editedItems.get(item.id);
          const finalItem = { ...item, ...edited };
          
          // Usar categoria editada, depois sugerida, depois padrão
          const categoryId = edited?.category_suggestion?.category_id 
            || finalItem.category_suggestion?.category_id 
            || formData.category_id;

          if (!finalItem.amount_cents || finalItem.amount_cents <= 0) {
            continue; // Pular itens sem valor válido
          }

          if (formData.destination_type === "account") {
            await transactionRepository.create({
              type: formData.type,
              amount_cents:
                formData.type === "income"
                  ? finalItem.amount_cents
                  : -finalItem.amount_cents,
              date: finalItem.date || formData.date,
              competence_month: finalItem.date
                ? finalItem.date.slice(0, 7)
                : formData.competence_month,
              description: finalItem.description || formData.description,
              account_id: formData.destination_id,
              category_id: categoryId,
            });
          } else {
            await transactionRepository.create({
              type: "credit_card_charge",
              amount_cents: -finalItem.amount_cents,
              date: finalItem.date || formData.date,
              competence_month: finalItem.date
                ? finalItem.date.slice(0, 7)
                : formData.competence_month,
              description: finalItem.description || formData.description,
              credit_card_id: formData.destination_id,
              category_id: categoryId,
              installments:
                formData.installments > 1 ? formData.installments : undefined,
            });
          }
        }

        setStep("success");
        setTimeout(() => {
          onSuccess?.();
          onClose();
          resetForm();
        }, 1500);
        return;
      }

      // Modo simples: salvar item único (comportamento original)
      if (formData.amount_cents <= 0) {
        setError(t(IRK.errors.invalidAmount));
        setIsLoading(false);
        return;
      }

      if (formData.destination_type === "account") {
        // Criar lançamento na conta
        await transactionRepository.create({
          type: formData.type,
          amount_cents:
            formData.type === "income"
              ? formData.amount_cents
              : -formData.amount_cents,
          date: formData.date,
          competence_month: formData.competence_month,
          description: formData.description,
          account_id: formData.destination_id,
          category_id: formData.category_id,
        });
      } else {
        // Criar compra no cartão
        const card = await creditCardRepository.findById(formData.destination_id);
        if (!card) {
          setError(t(IRK.errors.cardNotFound));
          setIsLoading(false);
          return;
        }

        // Validar limite disponível
        const totalAmount = formData.amount_cents;
        if (card.limit_available_cents < totalAmount) {
          setError("Limite disponível insuficiente");
          setIsLoading(false);
          return;
        }

        await transactionRepository.create({
          type: "credit_card_charge",
          amount_cents: -totalAmount,
          date: formData.date,
          competence_month: formData.competence_month,
          description: formData.description,
          credit_card_id: formData.destination_id,
          category_id: formData.category_id,
          installments:
            formData.installments > 1 ? formData.installments : undefined,
        });
      }

      setStep("success");
      setTimeout(() => {
        onSuccess?.();
        onClose();
        resetForm();
      }, 1500);
    } catch (err: any) {
      setError(err.message || t(IRK.errors.saveError));
    } finally {
      setIsLoading(false);
    }
  }

  if (step === "success") {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t(IRK.title)}>
        <div className="empty-state" style={{ padding: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
          <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>{t(IRK.success.message)}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t(IRK.title)}>
      {step === "select" && (
        <div>
          <div className="form-group">
            <label className="label">{t(IRK.selectFile.label)}</label>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              {t(IRK.selectFile.description)}
            </p>
            <button
              className="btn btn-secondary"
              onClick={handleSelectFile}
              disabled={isLoading}
              style={{ width: "100%" }}
            >
              <Upload size={16} />
              {isLoading ? t(IRK.selectFile.loading) : t(IRK.selectFile.button)}
            </button>
            {selectedFile && (
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                <FileText size={14} style={{ verticalAlign: "middle", marginRight: "0.25rem" }} />
                {selectedFile.split(/[\\/]/).pop()}
              </p>
            )}
          </div>
        </div>
      )}

      {step === "preview" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {error && (
            <div
              style={{
                padding: "0.75rem",
                background: "var(--bg-secondary)",
                borderRadius: "8px",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              <AlertCircle size={16} />
              <span style={{ fontSize: "0.875rem" }}>{error}</span>
            </div>
          )}

          {/* Preview do texto lido */}
          {parsedData && (
            <div style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                onClick={() => setShowTextPreview(!showTextPreview)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "var(--bg-secondary)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{t(IRK.preview.textPreview)}</span>
                <span>{showTextPreview ? "▼" : "▶"}</span>
              </button>
              {showTextPreview && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "4px",
                    maxHeight: "200px",
                    overflow: "auto",
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    color: "var(--text-secondary)",
                  }}
                >
                  {parsedData.extractedText && parsedData.extractedText.length > 0 ? (
                    parsedData.extractedText.substring(0, 6000)
                  ) : (
                    <span style={{ color: "var(--error)" }}>
                      {t(IRK.preview.textExtractionError)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Itens detectados (modo extrato) */}
          {parsedData?.items && parsedData.items.length > 1 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <label className="label">{t(IRK.preview.itemsDetected)} ({selectedItems.size} {t(IRK.preview.itemsSelected)})</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedItems(new Set(parsedData.items.map((item: ExtractedItem) => item.id)));
                    }}
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                  >
                    {t(IRK.preview.actions.selectAll)}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedItems(new Set())}
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                  >
                    {t(IRK.preview.actions.clear)}
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: "300px", overflow: "auto", border: "1px solid var(--border)", borderRadius: "4px" }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}></th>
                      <th>{t(IRK.preview.table.date)}</th>
                      <th>{t(IRK.preview.table.description)}</th>
                      <th>{t(IRK.preview.table.amount)}</th>
                      <th>{t(IRK.preview.table.suggestedCategory)}</th>
                      <th>{t(IRK.preview.table.confidence)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.items.map((item: ExtractedItem) => {
                      const edited = editedItems.get(item.id);
                      const finalItem = { ...item, ...edited };
                      const isSelected = selectedItems.has(item.id);
                      
                      return (
                        <tr key={item.id} style={{ background: isSelected ? "var(--bg-secondary)" : "transparent" }}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSelected = new Set(selectedItems);
                                if (e.target.checked) {
                                  newSelected.add(item.id);
                                } else {
                                  newSelected.delete(item.id);
                                }
                                setSelectedItems(newSelected);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={finalItem.date || formData.date}
                              onChange={(e) => {
                                const newEdited = new Map(editedItems);
                                const current = newEdited.get(item.id) || {};
                                newEdited.set(item.id, { ...current, date: e.target.value });
                                setEditedItems(newEdited);
                              }}
                              style={{ 
                                fontSize: "0.875rem", 
                                padding: "0.5rem", 
                                width: "100%",
                                border: "1px solid var(--border)",
                                borderRadius: "4px",
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={finalItem.description || ""}
                              onChange={(e) => {
                                const newEdited = new Map(editedItems);
                                const current = newEdited.get(item.id) || {};
                                newEdited.set(item.id, { ...current, description: e.target.value });
                                setEditedItems(newEdited);
                              }}
                              style={{ 
                                fontSize: "0.875rem", 
                                padding: "0.5rem", 
                                width: "100%",
                                border: "1px solid var(--border)",
                                borderRadius: "4px",
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatMoneyInput(finalItem.amount_cents || 0)}
                              onChange={(e) => {
                                const cleaned = cleanMoneyInput(e.target.value);
                                const newEdited = new Map(editedItems);
                                const current = newEdited.get(item.id) || {};
                                newEdited.set(item.id, {
                                  ...current,
                                  amount_cents: parseMoneyInput(cleaned),
                                });
                                setEditedItems(newEdited);
                              }}
                              style={{ 
                                fontSize: "0.875rem", 
                                padding: "0.5rem", 
                                width: "100%",
                                border: "1px solid var(--border)",
                                borderRadius: "4px",
                              }}
                              placeholder={getMoneyPlaceholder(destinationCurrency, locale)}
                            />
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              <select
                                value={edited?.category_suggestion?.category_id || finalItem.category_suggestion?.category_id || formData.category_id}
                                onChange={(e) => {
                                  const newEdited = new Map(editedItems);
                                  const current = newEdited.get(item.id) || {};
                                  const selectedCategoryId = parseInt(e.target.value) || formData.category_id;
                                  newEdited.set(item.id, {
                                    ...current,
                                    category_suggestion: {
                                      category_id: selectedCategoryId,
                                      label: categories.find(c => c.id === selectedCategoryId)?.name || t(RK.csvNoCategory),
                                      confidence: 100,
                                    },
                                  });
                                  setEditedItems(newEdited);
                                }}
                                style={{ 
                                  fontSize: "0.875rem", 
                                  padding: "0.5rem", 
                                  width: "100%",
                                  border: "1px solid var(--border)",
                                  borderRadius: "4px",
                                }}
                              >
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                              {finalItem.category_suggestion && !editedItems.get(item.id)?.category_suggestion && (
                                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                  Sugerido: {finalItem.category_suggestion.label} ({finalItem.category_suggestion.confidence}%)
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                              {finalItem.confidence}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Formulário inferior - apenas no modo simples (1 item ou nenhum item) */}
          {(!parsedData?.items || parsedData.items.length <= 1) && (
            <>
              {/* Valores detectados (modo simples) */}
              {parsedData?.amountCandidates && parsedData.amountCandidates.length > 0 && (
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="label">{t(IRK.preview.itemsDetected)}</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {parsedData.amountCandidates.map((candidate: any, index: number) => (
                  <label
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.5rem",
                      background: selectedAmountIndex === index ? "var(--bg-secondary)" : "transparent",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="amount"
                      checked={selectedAmountIndex === index}
                      onChange={() => {
                        setSelectedAmountIndex(index);
                        setFormData((prev) => ({
                          ...prev,
                          amount_cents: candidate.cents,
                        }));
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>
                        {formatMoney(candidate.cents, settings.currency)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {candidate.raw} • {candidate.reason}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Datas detectadas */}
          {parsedData?.dateCandidates && parsedData.dateCandidates.length > 0 && (
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="label">{t(IRK.preview.itemsDetected)}</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {parsedData.dateCandidates.map((candidate: any, index: number) => (
                  <label
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.5rem",
                      background: selectedDateIndex === index ? "var(--bg-secondary)" : "transparent",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="date"
                      checked={selectedDateIndex === index}
                      onChange={() => {
                        setSelectedDateIndex(index);
                        setFormData((prev) => ({
                          ...prev,
                          date: candidate.date,
                          competence_month: candidate.date.slice(0, 7),
                        }));
                      }}
                    />
                    <div>
                      {new Date(candidate.date + "T00:00:00").toLocaleDateString("pt-BR")} ({candidate.raw})
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

              <div className="form-group">
                <label className="label">
                  Valor ({settings.currency})
              {parsedData?.amountCandidates && parsedData.amountCandidates.length === 0 && (
                <span style={{ color: "var(--error)", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
                  (preencha manualmente)
                </span>
              )}
            </label>
            <input
              className="input"
              type="text"
              inputMode="decimal"
              value={formatMoneyInput(formData.amount_cents)}
              onChange={(e) => {
                const cleaned = cleanMoneyInput(e.target.value);
                setFormData({
                  ...formData,
                  amount_cents: parseMoneyInput(cleaned),
                });
                setSelectedAmountIndex(null); // Desmarcar seleção se editar manualmente
              }}
              placeholder={getMoneyPlaceholder(destinationCurrency, locale)}
              required
              style={{
                borderColor: parsedData?.amountCandidates && parsedData.amountCandidates.length === 0 
                  ? "var(--error)" 
                  : undefined,
              }}
            />
          </div>

          <DatePicker
            label={t(IRK.form.fields.date)}
            value={formData.date}
            onChange={(date) => {
              setFormData({
                ...formData,
                date,
                competence_month: date.slice(0, 7),
              });
            }}
            required
          />

          <div className="form-group">
            <label className="label">{t(IRK.form.fields.description)}</label>
            <input
              className="input"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t(IRK.placeholders.merchantOrDescription)}
            />
          </div>

          <div className="form-group">
            <label className="label">{t(IRK.form.fields.category)}</label>
            <select
              className="input"
              value={formData.category_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category_id: parseInt(e.target.value) || 1,
                })
              }
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

              <div className="form-group">
                <label className="label">{t(IRK.form.fields.type)}</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "expense" | "income",
                    })
                  }
                >
                  <option value="expense">{t(IRK.form.types.expense)}</option>
                  <option value="income">{t(IRK.form.types.income)}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">{t(IRK.form.fields.destination)}</label>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      checked={formData.destination_type === "account"}
                      onChange={() => {
                        setFormData({
                          ...formData,
                          destination_type: "account",
                          destination_id: accounts[0]?.id || 0,
                        });
                      }}
                    />
                    {t(IRK.form.destinations.account)}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      checked={formData.destination_type === "card"}
                      onChange={() => {
                        setFormData({
                          ...formData,
                          destination_type: "card",
                          destination_id: cards[0]?.id || 0,
                        });
                      }}
                    />
                    {t(IRK.form.destinations.card)}
                  </label>
                </div>

                {formData.destination_type === "account" ? (
                  <select
                    className="input"
                    value={formData.destination_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destination_id: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  >
                    <option value="">{t(IRK.form.selectAccount)}</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <select
                      className="input"
                      value={formData.destination_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destination_id: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                      style={{ marginBottom: "0.75rem" }}
                    >
                      <option value="">{t(IRK.form.selectCard)}</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name}
                        </option>
                      ))}
                    </select>
                    <div className="form-group">
                      <label className="label">{t(IRK.form.fields.installments)}</label>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={formData.installments}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            installments: parseInt(e.target.value) || 1,
                          })
                        }
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Destino e botões - sempre visíveis */}
          {parsedData?.items && parsedData.items.length > 1 && (
            <div className="form-group" style={{ marginTop: "1.5rem" }}>
              <label className="label">{t(IRK.form.fields.destination)}</label>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="radio"
                    checked={formData.destination_type === "account"}
                    onChange={() => {
                      setFormData({
                        ...formData,
                        destination_type: "account",
                        destination_id: accounts[0]?.id || 0,
                      });
                    }}
                  />
                  Conta
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="radio"
                    checked={formData.destination_type === "card"}
                    onChange={() => {
                      setFormData({
                        ...formData,
                        destination_type: "card",
                        destination_id: cards[0]?.id || 0,
                      });
                    }}
                  />
                  Cartão
                </label>
              </div>

              {formData.destination_type === "account" ? (
                <select
                  className="input"
                  value={formData.destination_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destination_id: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                >
                  <option value="">{t(AK.common.selectAccount)}</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <select
                    className="input"
                    value={formData.destination_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destination_id: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                    style={{ marginBottom: "0.75rem" }}
                  >
                    <option value="">{t(IRK.form.selectCard)}</option>
                    {cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    ))}
                  </select>
                  <div className="form-group">
                    <label className="label">{t(IRK.form.fields.installments)}</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={formData.installments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installments: parseInt(e.target.value) || 1,
                        })
                      }
                      required
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
              marginTop: "1.5rem",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              {t(AK.common.cancel)}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || (parsedData?.items && parsedData.items.length > 1 && selectedItems.size === 0)}
            >
              {isLoading
                ? t(TX.saving)
                : parsedData?.items && parsedData.items.length > 1
                ? t(TX.saveMany, { n: selectedItems.size })
                : t(TX.saveOne)}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

