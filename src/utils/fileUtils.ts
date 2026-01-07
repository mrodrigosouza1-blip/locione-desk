/**
 * Utilitários para download/upload de arquivos
 * Compatível com Electron, Tauri e web fallback
 */
import { logger } from "./logger";

export async function downloadFile(content: string, filename: string): Promise<void> {
  // Verificar se está em Tauri
  if (typeof window !== "undefined" && (window as any).locione) {
    try {
      const { dialog, fs } = (window as any).locione;
      if (dialog && fs) {
        const filePath = await dialog.save({
          filters: [{ name: "JSON", extensions: ["json"] }],
          defaultPath: filename,
        });
        
        if (filePath) {
          await fs.writeTextFile(filePath, content);
          return;
        }
      }
    } catch (error) {
      logger.warnTag("fileUtils", "Erro ao usar Tauri dialog, usando fallback web:", error);
    }
  }

  // Fallback web/Electron: usar Blob + download
  // Isso funciona tanto no web quanto no Electron (o usuário escolhe onde salvar)
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function selectFile(accept: string = ".json"): Promise<string | null> {
  // Verificar se está em Electron
  if (typeof window !== "undefined" && (window as any).electronAPI) {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI.readAppDataJson) {
        // Por enquanto, usar fallback web para seleção de arquivo
        // Electron não tem dialog nativo no preload atual
      }
    } catch (error) {
      logger.warnTag("fileUtils", "Erro ao usar Electron API, usando fallback web:", error);
    }
  }

  // Verificar se está em Tauri
  if (typeof window !== "undefined" && (window as any).locione) {
    try {
      const { dialog, fs } = (window as any).locione;
      if (dialog && fs) {
        const files = await dialog.open({
          filters: [{ name: "JSON", extensions: ["json"] }],
          multiple: false,
        });
        
        if (files && files.length > 0) {
          const content = await fs.readTextFile(files[0]);
          return content;
        }
      }
    } catch (error) {
      logger.warnTag("fileUtils", "Erro ao usar Tauri dialog, usando fallback web:", error);
    }
  }

  // Fallback web: usar input file
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      } else {
        resolve(null);
      }
    };
    input.click();
  });
}

