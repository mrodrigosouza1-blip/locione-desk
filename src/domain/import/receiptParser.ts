/**
 * Parser de recibos offline
 * Tenta extrair valor, data e descrição de arquivos de recibo
 * 
 * Exemplo de texto de recibo:
 * "SUPERMERCADO ABC
 * Rua das Flores, 123
 * Data: 15/01/2026
 * 
 * PRODUTO 1          R$ 10,50
 * PRODUTO 2          R$ 25,00
 * 
 * TOTAL: R$ 35,50
 * 
 * Resultado esperado:
 * - amountCandidates: [{ cents: 3550, raw: "R$ 35,50", reason: "TOTAL encontrado" }]
 * - dateCandidates: [{ date: "2026-01-15", raw: "15/01/2026" }]
 * - description: "SUPERMERCADO ABC"
 */

export interface AmountCandidate {
  cents: number;
  raw: string;
  reason: string;
  priority: number; // menor = maior prioridade
}

export interface DateCandidate {
  date: string; // YYYY-MM-DD
  raw: string;
}

export interface ExtractedItem {
  id: string;
  rawLine: string;
  amount_cents?: number;
  date?: string; // YYYY-MM-DD
  description?: string;
  currency_code?: string;
  confidence: number; // 0-100
  category_suggestion?: {
    category_id?: number;
    label: string;
    confidence: number;
  };
}

export interface ParsedReceipt {
  // Modo simples (recibo único)
  amount?: number; // em centavos (melhor palpite)
  date?: string; // YYYY-MM-DD (melhor palpite)
  description?: string;
  confidence: "high" | "medium" | "low" | "none";
  amountCandidates: AmountCandidate[];
  dateCandidates: DateCandidate[];
  extractedText: string; // texto completo extraído
  
  // Modo extrato (múltiplos itens)
  items: ExtractedItem[]; // lista de itens detectados
  isExtract: boolean; // true se detectou múltiplos itens (extrato)
}

/**
 * Normaliza string de valor para número
 */
function parseAmountString(amountStr: string): number | null {
  // Remover espaços e caracteres não numéricos exceto vírgula/ponto
  let cleaned = amountStr.replace(/[^\d.,]/g, "");
  
  // Detectar formato: italiano (1.234,56) ou inglês (1,234.56)
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  
  let normalized: string;
  if (hasComma && hasDot) {
    // Se tem ambos, o último é o decimal
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      // Formato italiano: 1.234,56
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato inglês: 1,234.56
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Apenas vírgula: pode ser italiano (1,23) ou milhar (1,234)
    if (cleaned.split(",")[1]?.length <= 2) {
      // Decimal: 1,23
      normalized = cleaned.replace(",", ".");
    } else {
      // Milhar: 1,234 -> 1234
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasDot) {
    // Apenas ponto: pode ser decimal (1.23) ou milhar (1.234)
    if (cleaned.split(".")[1]?.length <= 2) {
      // Decimal: 1.23
      normalized = cleaned;
    } else {
      // Milhar: 1.234 -> 1234
      normalized = cleaned.replace(/\./g, "");
    }
  } else {
    normalized = cleaned;
  }
  
  const amount = parseFloat(normalized);
  if (!isNaN(amount) && amount > 0 && amount < 1000000) {
    return Math.round(amount * 100); // converter para centavos
  }
  return null;
}

/**
 * Extrai texto de arquivo TXT ou CSV
 */
export async function parseTextFile(content: string): Promise<ParsedReceipt> {
  const result: ParsedReceipt = {
    confidence: "none",
    amountCandidates: [],
    dateCandidates: [],
    extractedText: content,
    items: [],
    isExtract: false,
  };

  const lines = content.split(/\r?\n/);
  const amountCandidates: AmountCandidate[] = [];

  // Palavras-chave de total (PT/IT) - prioridade máxima
  const totalKeywords = [
    /TOTAL[:\s]+/i,
    /TOTALE[:\s]+/i,
    /TOT[.\s]+/i,
    /IMPORTO[:\s]+/i,
    /PAGATO[:\s]+/i,
    /DA PAGARE[:\s]+/i,
    /TOTALE EURO[:\s]+/i,
    /TOT€[:\s]+/i,
  ];

  // Procurar valores em cada linha
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    
    // Verificar se linha contém palavra-chave de total
    let hasKeyword = false;
    let keywordPriority = 100;
    for (let j = 0; j < totalKeywords.length; j++) {
      if (totalKeywords[j].test(lineUpper)) {
        hasKeyword = true;
        keywordPriority = j; // primeira keyword = maior prioridade
        break;
      }
    }

    // Padrões de valor: R$ 12,34 | € 12,34 | 12,34 € | 12.34 | 1.234,56 | 1,234.56
    const amountPatterns = [
      /R\$\s*([\d.,]+)/i,
      /€\s*([\d.,]+)/i,
      /([\d.,]+)\s*€/i,
      /USD\s*([\d.,]+)/i,
      /EUR\s*([\d.,]+)/i,
      /\b([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/, // números com separadores
      /\b([\d]+[.,]\d{2})\b/, // números com 2 decimais
    ];

    for (const pattern of amountPatterns) {
      const matches = line.match(pattern);
      if (matches && matches[1]) {
        const cents = parseAmountString(matches[1]);
        if (cents) {
          const priority = hasKeyword ? keywordPriority : 50 + i; // linhas com keyword primeiro
          amountCandidates.push({
            cents,
            raw: matches[0],
            reason: hasKeyword 
              ? `Linha com ${lineUpper.match(/TOTAL[E]?|IMPORTO|PAGATO/i)?.[0] || "palavra-chave"} encontrada`
              : `Valor encontrado na linha ${i + 1}`,
            priority,
          });
        }
      }
    }
  }

  // Remover duplicatas e ordenar por prioridade
  const uniqueAmounts = new Map<number, AmountCandidate>();
  for (const candidate of amountCandidates) {
    const existing = uniqueAmounts.get(candidate.cents);
    if (!existing || candidate.priority < existing.priority) {
      uniqueAmounts.set(candidate.cents, candidate);
    }
  }
  result.amountCandidates = Array.from(uniqueAmounts.values())
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);

  // Selecionar melhor palpite (primeiro da lista ordenada)
  if (result.amountCandidates.length > 0) {
    result.amount = result.amountCandidates[0].cents;
    result.confidence = result.amountCandidates[0].priority < 10 ? "high" : "medium";
  }

  // Procurar datas
  const datePatterns = [
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/g, // dd/mm/yyyy
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})/g, // dd/mm/yy
  ];

  const dateCandidates: DateCandidate[] = [];
  for (const pattern of datePatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const day = match[1];
      const month = match[2];
      const year = match[3].length === 4 ? match[3] : `20${match[3]}`;
      
      // Validar data
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2100) {
        const dateStr = `${year}-${month}-${day}`;
        // Evitar duplicatas
        if (!dateCandidates.find(d => d.date === dateStr)) {
          dateCandidates.push({
            date: dateStr,
            raw: match[0],
          });
        }
      }
    }
  }
  result.dateCandidates = dateCandidates.slice(0, 5);

  // Selecionar melhor palpite de data
  if (result.dateCandidates.length > 0) {
    result.date = result.dateCandidates[0].date;
    if (result.confidence === "none") result.confidence = "medium";
  }

  // Procurar descrição (nome do estabelecimento)
  const descriptionPatterns = [
    /^([A-ZÁÉÍÓÚÇÀÈÌÒÙ\s]{5,50})/m,
    /ESTABELECIMENTO[:\s]+([A-ZÁÉÍÓÚÇÀÈÌÒÙ\s]{5,50})/i,
    /MERCADO[:\s]+([A-ZÁÉÍÓÚÇÀÈÌÒÙ\s]{5,50})/i,
    /LOJA[:\s]+([A-ZÁÉÍÓÚÇÀÈÌÒÙ\s]{5,50})/i,
    /NEGOCIO[:\s]+([A-ZÁÉÍÓÚÇÀÈÌÒÙ\s]{5,50})/i,
  ];

  for (const pattern of descriptionPatterns) {
    const matches = content.match(pattern);
    if (matches && matches[1]) {
      const desc = matches[1].trim();
      if (desc.length >= 3 && desc.length <= 50) {
        result.description = desc;
        if (result.confidence === "none") result.confidence = "low";
        break;
      }
    }
  }

  // Detectar se é extrato (múltiplas linhas com valores) ou recibo simples
  // Se houver mais de 3 linhas com valores, considerar extrato
  const linesWithAmounts = lines.filter((line) => {
    const amountPatterns = [
      /R\$\s*[\d.,]+/i,
      /€\s*[\d.,]+/i,
      /[\d.,]+\s*€/i,
      /\b[\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b/,
    ];
    return amountPatterns.some((pattern) => pattern.test(line));
  });

  if (linesWithAmounts.length > 3) {
    // Modo extrato: gerar múltiplos itens
    result.isExtract = true;
    result.items = [];

    // Tentar extrair itens linha por linha
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Procurar valor na linha
      const amountPatterns = [
        /R\$\s*([\d.,]+)/i,
        /€\s*([\d.,]+)/i,
        /([\d.,]+)\s*€/i,
        /\b([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/,
      ];

      for (const pattern of amountPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const cents = parseAmountString(match[1]);
          if (cents && cents > 0) {
            // Procurar data na linha ou nas linhas próximas
            let itemDate: string | undefined;
            for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
              const dateMatch = lines[j].match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4}|\d{2})/);
              if (dateMatch) {
                const day = dateMatch[1];
                const month = dateMatch[2];
                const year = dateMatch[3].length === 4 ? dateMatch[3] : `20${dateMatch[3]}`;
                const date = new Date(`${year}-${month}-${day}`);
                if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2100) {
                  itemDate = `${year}-${month}-${day}`;
                  break;
                }
              }
            }

            // Extrair descrição (texto antes do valor)
            const descMatch = line.replace(/R\$|€|[\d.,]+/g, "").trim();
            const description = descMatch.length > 0 && descMatch.length < 100 ? descMatch : undefined;

            result.items.push({
              id: `item-${i}-${Date.now()}`,
              rawLine: line,
              amount_cents: cents,
              date: itemDate,
              description,
              confidence: 60, // confiança média para itens de extrato
            });

            break; // Uma linha = um item
          }
        }
      }
    }

    // Se não gerou itens, criar um item único com o melhor palpite
    if (result.items.length === 0 && result.amountCandidates.length > 0) {
      result.items.push({
        id: "item-single",
        rawLine: content.substring(0, 100),
        amount_cents: result.amountCandidates[0].cents,
        date: result.date,
        description: result.description,
        confidence: result.confidence === "high" ? 80 : result.confidence === "medium" ? 60 : 40,
      });
    }
  } else {
    // Modo recibo simples: criar item único
    if (result.amountCandidates.length > 0) {
      result.items.push({
        id: "item-single",
        rawLine: content.substring(0, 100),
        amount_cents: result.amountCandidates[0].cents,
        date: result.date,
        description: result.description,
        confidence: result.confidence === "high" ? 80 : result.confidence === "medium" ? 60 : 40,
      });
    }
  }

  return result;
}

/**
 * Tenta extrair texto de PDF (simplificado, sem biblioteca externa)
 * Para PDFs com texto, o Tauri pode ler como binário, mas não temos parser PDF completo
 * Retorna string vazia para indicar que precisa de preenchimento manual
 */
async function extractTextFromPDF(_filePath: string): Promise<string> {
  // MVP: PDFs precisam de biblioteca (pdfjs-dist) para extração completa
  // Por enquanto, retornamos vazio e o usuário preenche manualmente
  return "";
}

/**
 * Tenta extrair dados de um arquivo
 */
export async function parseReceiptFile(
  fileContent: string,
  mimeType: string,
  filePath?: string
): Promise<ParsedReceipt> {
  if (mimeType === "text/plain" || mimeType === "text/csv") {
    return await parseTextFile(fileContent);
  }

  if (mimeType === "application/pdf") {
    // Tentar extrair texto do PDF se possível
    let extractedText = "";
    if (filePath) {
      extractedText = await extractTextFromPDF(filePath);
    }
    
    return {
      confidence: "none",
      amountCandidates: [],
      dateCandidates: [],
      extractedText,
      items: [],
      isExtract: false,
    };
  }

  // Para imagens e outros formatos
  return {
    confidence: "none",
    amountCandidates: [],
    dateCandidates: [],
    extractedText: "",
    items: [],
    isExtract: false,
  };
}

