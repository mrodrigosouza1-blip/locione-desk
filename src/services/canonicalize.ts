/**
 * Canonicalização de objetos JSON
 * Ordena chaves recursivamente e retorna JSON string sem espaços
 * Deve bater com a implementação do site
 */

/**
 * Canonicaliza um objeto ordenando todas as chaves recursivamente
 * e retornando JSON string sem espaços
 * Deve bater com a implementação do site
 */
export function canonicalize(obj: any): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  // Primitivos: retornar como está
  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  // Arrays: manter ordem, canonicalizar cada elemento
  if (Array.isArray(obj)) {
    const canonicalItems = obj.map((item) => {
      // Recursivamente canonicalizar cada item
      const canonicalItemStr = canonicalize(item);
      // Parse para obter o objeto canonicalizado
      return JSON.parse(canonicalItemStr);
    });
    return JSON.stringify(canonicalItems);
  }

  // Objetos: ordenar chaves recursivamente
  const sortedKeys = Object.keys(obj).sort();
  const canonicalObj: Record<string, any> = {};

  for (const key of sortedKeys) {
    // Recursivamente canonicalizar o valor
    const canonicalValueStr = canonicalize(obj[key]);
    // Parse para obter o valor canonicalizado
    canonicalObj[key] = JSON.parse(canonicalValueStr);
  }

  return JSON.stringify(canonicalObj);
}

