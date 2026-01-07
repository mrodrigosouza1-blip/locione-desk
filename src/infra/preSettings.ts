/**
 * PreSettings - Armazenamento de settings antes do DB estar inicializado
 * Usa localStorage ou Electron API (se disponível) para persistir dados críticos de boot
 */

const PREFIX = "locione:pre:";

/**
 * Verifica se está rodando no Electron
 */
function isElectron(): boolean {
  return typeof window !== "undefined" && (window as any).electron !== undefined;
}

/**
 * Obtém um setting pré-DB
 */
export function getPreSetting(key: string): string | null {
  try {
    if (isElectron() && (window as any).electron?.ipcRenderer) {
      // Em Electron, tentar usar IPC para ler de userData
      // Por enquanto, fallback para localStorage
      const value = localStorage.getItem(PREFIX + key);
      return value;
    }
    
    // Fallback: localStorage
    return localStorage.getItem(PREFIX + key);
  } catch (error) {
    console.warn("[preSettings] Erro ao ler setting:", key, error);
    return null;
  }
}

/**
 * Define um setting pré-DB
 */
export function setPreSetting(key: string, value: string): void {
  try {
    if (isElectron() && (window as any).electron?.ipcRenderer) {
      // Em Electron, tentar usar IPC para salvar em userData
      // Por enquanto, fallback para localStorage
      localStorage.setItem(PREFIX + key, value);
      return;
    }
    
    // Fallback: localStorage
    localStorage.setItem(PREFIX + key, value);
  } catch (error) {
    console.warn("[preSettings] Erro ao salvar setting:", key, error);
  }
}

/**
 * Remove um setting pré-DB
 */
export function removePreSetting(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (error) {
    console.warn("[preSettings] Erro ao remover setting:", key, error);
  }
}

