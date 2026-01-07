import { categoryRepository } from "../../infra/repositories/categoryRepository";

export interface CategorySuggestion {
  category_id?: number;
  label: string;
  confidence: number; // 0-100
}

/**
 * Dicionário de palavras-chave para sugestão de categoria
 */
const categoryKeywords: Record<string, { label: string; keywords: string[] }> = {
  transporte: {
    label: "Transporte",
    keywords: ["uber", "bolt", "trenitalia", "taxi", "metro", "bus", "onibus", "transporte", "viagem", "viaggi"],
  },
  mercado: {
    label: "Mercado",
    keywords: ["coop", "conad", "esselunga", "supermercado", "super", "mercado", "market", "supermarket"],
  },
  assinaturas: {
    label: "Assinaturas",
    keywords: ["spotify", "netflix", "amazon prime", "disney", "apple", "google", "microsoft", "subscription"],
  },
  saude: {
    label: "Saúde",
    keywords: ["farmacia", "pharm", "farmacia", "farmacie", "medico", "dottore", "hospital", "clinica"],
  },
  alimentacao: {
    label: "Alimentação",
    keywords: ["ristorante", "pizza", "bar", "restaurante", "restaurant", "cafe", "caffè", "food", "delivery"],
  },
  casa: {
    label: "Casa",
    keywords: ["ikea", "leroy", "bricoman", "casa", "home", "utilities", "utilities", "energia", "luz", "gas"],
  },
  outros: {
    label: "Outros",
    keywords: [],
  },
};

/**
 * Sugere categoria baseado em descrição e merchant
 */
export async function suggestCategory(input: {
  description: string;
  merchant?: string;
  amount_cents?: number;
}): Promise<CategorySuggestion> {
  const searchText = `${input.description} ${input.merchant || ""}`.toLowerCase();

  // Primeiro, tentar match com categorias existentes no DB
  try {
    const categories = await categoryRepository.findAll();
    
    // Buscar match exato ou parcial no nome da categoria
    for (const category of categories) {
      const categoryNameLower = category.name.toLowerCase();
      
      // Match exato (maior confiança)
      if (searchText === categoryNameLower || categoryNameLower === searchText) {
        return {
          category_id: category.id,
          label: category.name,
          confidence: 90,
        };
      }
      
      // Match parcial: texto contém nome da categoria ou vice-versa
      if (searchText.includes(categoryNameLower) || categoryNameLower.includes(searchText.substring(0, Math.min(15, searchText.length)))) {
        return {
          category_id: category.id,
          label: category.name,
          confidence: 75,
        };
      }
    }
    
    // Tentar match com palavras-chave do dicionário que correspondem a categorias existentes
    for (const category of categories) {
      const categoryNameLower = category.name.toLowerCase();
      
      // Verificar se alguma palavra-chave do dicionário corresponde ao nome da categoria
      for (const [, data] of Object.entries(categoryKeywords)) {
        if (data.label.toLowerCase() === categoryNameLower) {
          // Se encontrou palavra-chave no texto e a categoria existe, retornar
          for (const keyword of data.keywords) {
            if (searchText.includes(keyword)) {
              return {
                category_id: category.id,
                label: category.name,
                confidence: 70,
              };
            }
          }
        }
      }
    }
  } catch (error) {
    // Se não conseguir carregar categorias, continuar com heurística
  }

  // Se não encontrou match, usar heurística local
  let bestMatch: { label: string; confidence: number } | null = null;

  for (const [key, data] of Object.entries(categoryKeywords)) {
    if (key === "outros") continue; // outros é fallback

    for (const keyword of data.keywords) {
      if (searchText.includes(keyword)) {
        // Quanto mais específico o match, maior a confiança
        const confidence = keyword.length > 5 ? 70 : 50;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { label: data.label, confidence };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      label: bestMatch.label,
      confidence: bestMatch.confidence,
    };
  }

  // Fallback: "Outros"
  return {
    label: "Outros",
    confidence: 10,
  };
}

