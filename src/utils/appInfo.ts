/**
 * Informações centralizadas sobre o aplicativo.
 * Seguro para uso tanto no renderer quanto no Electron.
 */

import { APP_NAME } from "../config/brand";
import { IS_DEV } from "./isDev";

// Versão do app (lida do package.json ou injetada via build)
let APP_VERSION = "0.9.0-beta.1";
let BUILD_DATE = new Date().toISOString();

// Tentar ler versão do package.json (apenas no Electron main process)
// NOTA: require() aqui é seguro porque só executa no main process do Electron, não no renderer
if (typeof process !== "undefined" && process.versions?.electron && typeof require !== "undefined") {
  try {
    // No Electron main process, podemos ler do package.json
    const packageJson = require("../../package.json");
    if (packageJson.version) {
      APP_VERSION = packageJson.version;
    }
  } catch (error) {
    // Fallback: usar versão padrão
  }
}

// Tentar ler versão via window.__APP_VERSION__ se injetada no build
if (typeof window !== "undefined" && (window as any).__APP_VERSION__) {
  APP_VERSION = (window as any).__APP_VERSION__;
}

// Tentar ler BUILD_DATE via window.__BUILD_DATE__ se injetada no build
if (typeof window !== "undefined" && (window as any).__BUILD_DATE__) {
  BUILD_DATE = (window as any).__BUILD_DATE__;
}

/**
 * Obtém a plataforma atual
 */
function getPlatform(): string {
  if (typeof process !== "undefined" && process.platform) {
    const platform = process.platform;
    switch (platform) {
      case "darwin":
        return "macOS";
      case "win32":
        return "Windows";
      case "linux":
        return "Linux";
      default:
        return platform;
    }
  }
  
  // Fallback para web
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Win")) return "Windows";
  if (userAgent.includes("Linux")) return "Linux";
  
  return "Web";
}

/**
 * Obtém o caminho do diretório de dados do usuário (apenas no Electron)
 */
async function getUserDataPath(): Promise<string | null> {
  if (typeof window !== "undefined" && (window as any).electronAPI) {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI.getUserDataPath) {
        const path = await electronAPI.getUserDataPath();
        return path || null;
      }
    } catch (error) {
      // Fallback: retornar null
    }
  }
  
  return null;
}

export const appInfo = {
  name: APP_NAME,
  version: APP_VERSION,
  buildDate: BUILD_DATE,
  platform: getPlatform(),
  getUserDataPath,
};

/**
 * Gera string de diagnóstico completa para copiar
 * Em PROD, não inclui informações de debug (plataforma, diretório de dados)
 */
export async function getDiagnosticInfo(): Promise<string> {
  const lines = [
    `${appInfo.name}`,
    `Versão: ${appInfo.version}`,
    `Build: ${appInfo.buildDate}`,
  ];
  
  // Informações de debug apenas em DEV
  if (IS_DEV) {
    lines.push(`Plataforma: ${appInfo.platform}`);
    const userDataPath = await getUserDataPath();
    if (userDataPath) {
      lines.push(`Diretório de dados: ${userDataPath}`);
    }
  }
  
  return lines.join("\n");
}

