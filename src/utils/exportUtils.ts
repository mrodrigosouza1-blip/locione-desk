/**
 * Utilitário para criar HTML completo de exportação de relatórios
 * Garante que o conteúdo exportado seja exatamente o mesmo do preview
 */

export function createReportExportHTML(
  title: string,
  bodyHtml: string,
  cssText: string
): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${cssText}
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

/**
 * Extrai todos os estilos CSS necessários para o relatório
 */
export function getExportCSS(): string {
  return `
    /* Reset e base */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: white;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Variáveis CSS para cores */
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f5f5f5;
      --text-primary: #1a1a1a;
      --text-secondary: #666666;
      --border-color: #e0e0e0;
      --success: #10b981;
      --error: #ef4444;
      --warning: #f59e0b;
      --card-bg: #ffffff;
      --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Cards */
    .card {
      background: var(--card-bg);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--border-color);
      page-break-inside: avoid;
      margin-bottom: 1.5rem;
    }

    /* Grid */
    .grid {
      display: grid;
      gap: 1.5rem;
      page-break-inside: avoid;
    }

    .grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    .grid-5 {
      grid-template-columns: repeat(5, 1fr);
    }

    /* Títulos */
    h1 {
      font-size: 1.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }

    /* Tabelas */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
      page-break-inside: avoid;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    th {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.875rem;
      background: var(--bg-secondary);
    }

    /* SVG e gráficos */
    svg {
      max-width: 100%;
      height: auto;
      display: block;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    /* Garantir que não há overflow que corte conteúdo */
    #report-export-root,
    #report-export-root > *,
    .reports-export-view,
    .reports-export-view > * {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }

    /* Print styles */
    @media print {
      @page {
        margin: 1.5cm;
        size: A4;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      body {
        padding: 0;
        max-width: 100%;
        height: auto !important;
        overflow: visible !important;
      }

      #report-export-root,
      .reports-export-view {
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        page-break-inside: auto;
      }

      .card {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 1rem;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }

      .grid {
        page-break-inside: avoid;
        break-inside: avoid;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }

      svg {
        page-break-inside: avoid;
        break-inside: avoid;
        display: block !important;
        visibility: visible !important;
        max-width: 100% !important;
        height: auto !important;
      }

      table {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      h1, h2 {
        page-break-after: avoid;
        page-break-inside: avoid;
      }

      /* Garantir que gráficos apareçam */
      .card svg,
      svg {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      /* Evitar que elementos fiquem cortados */
      .card,
      .grid,
      table,
      svg {
        orphans: 3;
        widows: 3;
      }
    }
  `;
}

/**
 * Clona o DOM de um elemento e retorna HTML completo
 * Garante que gráficos SVG sejam incluídos
 */
export async function cloneExportDOM(element: HTMLElement): Promise<string> {
  // Aguardar renderização completa (múltiplos frames para garantir)
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  // Aguardar fontes se disponível
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Clonar o elemento profundamente (incluindo todos os filhos e estilos)
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Remover elementos que não devem aparecer no export
  const elementsToRemove = clone.querySelectorAll('.no-print, button, .modal-close, .page-header');
  elementsToRemove.forEach((el) => el.remove());

  // Garantir que SVGs sejam visíveis e tenham estilos corretos
  const svgs = clone.querySelectorAll('svg');
  svgs.forEach((svg) => {
    const htmlSvg = svg as SVGElement;
    htmlSvg.setAttribute('style', 'display: block !important; max-width: 100% !important; height: auto !important; visibility: visible !important;');
    // Garantir que o SVG tenha viewBox se não tiver
    if (!htmlSvg.getAttribute('viewBox') && htmlSvg.getAttribute('width') && htmlSvg.getAttribute('height')) {
      htmlSvg.setAttribute('viewBox', `0 0 ${htmlSvg.getAttribute('width')} ${htmlSvg.getAttribute('height')}`);
    }
  });

  // Garantir que cards e containers não tenham height fixa
  const cards = clone.querySelectorAll('.card');
  cards.forEach((card) => {
    const htmlCard = card as HTMLElement;
    htmlCard.style.height = 'auto';
    htmlCard.style.maxHeight = 'none';
    htmlCard.style.overflow = 'visible';
  });

  // Garantir que grids não tenham height fixa
  const grids = clone.querySelectorAll('.grid');
  grids.forEach((grid) => {
    const htmlGrid = grid as HTMLElement;
    htmlGrid.style.height = 'auto';
    htmlGrid.style.maxHeight = 'none';
    htmlGrid.style.overflow = 'visible';
  });

  // Converter variáveis CSS para valores reais (para garantir que apareçam no print)
  const style = window.getComputedStyle(element);
  const root = clone;
  root.style.color = style.color || '#1a1a1a';
  root.style.backgroundColor = style.backgroundColor || 'white';

  return clone.innerHTML;
}

