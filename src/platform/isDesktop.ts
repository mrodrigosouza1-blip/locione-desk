/**
 * Detecta se está rodando em ambiente desktop/Electron
 */
export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  
  // Verificar se existe electronAPI (Electron)
  if ((window as any).electronAPI) {
    return true;
  }
  
  // Verificar se existe locione API (Tauri ou outro bridge)
  if ((window as any).locione) {
    return true;
  }
  
  // Fallback: verificar user agent (não confiável, mas útil)
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("electron") || ua.includes("tauri")) {
    return true;
  }
  
  return false;
}

