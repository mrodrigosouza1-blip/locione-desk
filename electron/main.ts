import { createRequire } from "module";
import * as path from "path";
import { fileURLToPath } from "url";
import type * as Electron from "electron";
import { registerIpcHandlers } from "./ipc/fs.js";
import { getLockOnMinimizeSetting } from "./utils/readSettings.js";
import { logger } from "./utils/logger.js";

const require = createRequire(import.meta.url);
const electron = require("electron");
const { app, BrowserWindow, session, nativeImage } = electron;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// Caminho do index.html em produção (ESM-safe)
const indexHtmlPath = path.join(__dirname, "../dist/index.html");

// URL do Vite em desenvolvimento (deve corresponder exatamente ao host/porta do Vite)
const DEV_URL = "http://127.0.0.1:1420/";
const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY_MS = 500;

// Configurar Content Security Policy
function setupCSP() {
  session.defaultSession.webRequest.onHeadersReceived(
    (
      details: Electron.OnHeadersReceivedListenerDetails,
      callback: (response: Electron.HeadersReceivedResponse) => void
    ) => {
      let csp: string;

      if (isDev) {
        // CSP para desenvolvimento: permite 127.0.0.1 e unsafe-eval (necessário para Vite HMR)
        csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://127.0.0.1:1420 ws://127.0.0.1:1420",
          "style-src 'self' 'unsafe-inline' http://127.0.0.1:1420",
          "img-src 'self' data: http://127.0.0.1:1420",
          "font-src 'self' data: http://127.0.0.1:1420",
          "connect-src 'self' http://127.0.0.1:1420 ws://127.0.0.1:1420 ws://127.0.0.1:*",
          "frame-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests",
        ].join("; ");
      } else {
        // CSP para produção: mais restritiva, sem unsafe-eval e sem localhost
        // Permite conexões com api.locione.com para licenciamento online (CRL)
        csp = [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self' data:",
          "connect-src 'self' https://api.locione.com",
          "frame-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests",
        ].join("; ");
      }

      callback({
        responseHeaders: {
          ...(details.responseHeaders || {}),
          "Content-Security-Policy": [csp],
        },
      });
    }
  );
}

async function createWindow() {
  // Configurar ícone da janela e Dock (macOS)
  const fs = require("fs");
  let iconPath: string | undefined;
  
  // Função auxiliar para verificar se arquivo existe
  const getIconPath = (iconPathToCheck: string): string | undefined => {
    try {
      if (fs.existsSync(iconPathToCheck)) {
        return iconPathToCheck;
      }
    } catch {
      // Fallback silencioso
    }
    return undefined;
  };

  if (isDev) {
    // Em desenvolvimento, usar o ícone da pasta src/assets/brand
    const devIconPath = path.join(__dirname, "../../src/assets/brand/app-icon-1024.png");
    iconPath = getIconPath(devIconPath);
  } else {
    // Em produção, usar o ícone gerado em build/
    // Primeiro tentar via app.getAppPath() (caminho correto no app empacotado)
    const appPath = app.getAppPath();
    const prodIconPath = path.resolve(appPath, "build/icon.png");
    iconPath = getIconPath(prodIconPath);
    
    // Se não encontrou, tentar via __dirname (fallback)
    if (!iconPath) {
      const fallbackProdPath = path.join(__dirname, "../build/icon.png");
      iconPath = getIconPath(fallbackProdPath);
    }
    
    // Último fallback: app-icon-1024.png
    if (!iconPath) {
      const fallbackPath = path.resolve(appPath, "src/assets/brand/app-icon-1024.png");
      iconPath = getIconPath(fallbackPath);
    }
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // Eventos de janela para lock on minimize
  mainWindow.on("minimize", async () => {
    try {
      const lockOnMinimize = await getLockOnMinimizeSetting();
      if (lockOnMinimize) {
        logger.debugTag("ELECTRON", "Minimize detected, locking app");
        mainWindow.webContents.send("app:lock");
      }
    } catch (error) {
      logger.warnTag("ELECTRON", "Erro ao verificar lock on minimize:", error);
    }
  });

  mainWindow.on("restore", () => {
    // Quando restaurar, não desbloqueia automaticamente
    // O AppGate mantém o lock até o usuário inserir o PIN
    logger.debugTag("ELECTRON", "Window restored");
  });

  // Opcional: também bloquear em blur (quando janela perde foco)
  mainWindow.on("blur", async () => {
    try {
      const lockOnMinimize = await getLockOnMinimizeSetting();
      if (lockOnMinimize) {
        logger.debugTag("ELECTRON", "Blur detected, locking app");
        mainWindow.webContents.send("app:lock");
      }
    } catch (error) {
      logger.warnTag("ELECTRON", "Erro ao verificar lock on minimize no blur:", error);
    }
  });

  // Logs de diagnóstico APENAS em produção
  if (app.isPackaged) {
    // Listener para mensagens do console do renderer
    mainWindow.webContents.on("console-message", (
      event: Electron.Event,
      level: number,
      message: string,
      line: number,
      sourceId: string
    ) => {
      const levelName = level === 0 ? "log" : level === 1 ? "warn" : "error";
      logger.infoTag("ELECTRON", `[console-${levelName}] ${message} (${sourceId}:${line})`);
    });

    // Listener para processos de renderização que falharam
    mainWindow.webContents.on("render-process-gone", (
      event: Electron.Event,
      details: Electron.Details
    ) => {
      logger.errorTag("ELECTRON", "[prod] Render process gone:", details);
    });

    // Listener para falhas de carregamento em produção
    mainWindow.webContents.on("did-fail-load", (
      event: Electron.Event,
      errorCode: number,
      errorDescription: string,
      validatedURL: string
    ) => {
      logger.errorTag("ELECTRON", "[prod] Load failed:", {
        code: errorCode,
        description: errorDescription,
        url: validatedURL,
      });
    });
  }

  if (isDev) {
    let retryCount = 0;

    function loadDevURL() {
      logger.debugTag("ELECTRON", "Loading URL:", DEV_URL);
      mainWindow.loadURL(DEV_URL).catch((error: Error) => {
        logger.errorTag("ELECTRON", "Failed to load URL:", error);
      });
    }

    // Listener para falhas de carregamento
    mainWindow.webContents.on("did-fail-load", (
      event: Electron.Event,
      errorCode: number,
      errorDescription: string,
      validatedURL: string
    ) => {
      logger.errorTag("ELECTRON", "Load failed:", {
        code: errorCode,
        description: errorDescription,
        url: validatedURL,
        retryCount,
      });

      // Retry automático apenas em DEV e se não excedeu o limite
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        retryCount++;
        logger.debugTag("ELECTRON", `Retrying in ${RETRY_DELAY_MS}ms (attempt ${retryCount}/${MAX_RETRY_ATTEMPTS})...`);
        setTimeout(() => {
          loadDevURL();
        }, RETRY_DELAY_MS);
      } else {
        logger.errorTag("ELECTRON", "Max retry attempts reached. Please ensure Vite is running on", DEV_URL);
        mainWindow.webContents.send("dev-server-error", {
          message: `Failed to load ${DEV_URL} after ${MAX_RETRY_ATTEMPTS} attempts`,
          errorCode,
          errorDescription,
        });
      }
    });

    // Listener para quando a página carregar com sucesso
    mainWindow.webContents.on("did-finish-load", () => {
      logger.debugTag("ELECTRON", "Page loaded successfully");
      retryCount = 0; // Reset retry count on success
    });

    // Listener para processos de renderização que falharam
    mainWindow.webContents.on("render-process-gone", (
      event: Electron.Event,
      details: Electron.Details
    ) => {
      logger.errorTag("ELECTRON", "Render process gone:", details);
    });

    // Listener para quando a janela fica sem resposta
    mainWindow.on("unresponsive", () => {
      logger.warnTag("ELECTRON", "Window became unresponsive");
    });

    // Carregar URL inicial
    loadDevURL();
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção, carregar arquivo local
    logger.infoTag("ELECTRON", "Loading indexHtmlPath:", indexHtmlPath);
    await mainWindow.loadFile(indexHtmlPath);

    // Habilitar DevTools em produção apenas se LOCIONE_DEBUG=1
    if (process.env.LOCIONE_DEBUG === "1") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  }

  return mainWindow;
}

app.whenReady().then(() => {
  // Configurar ícone do Dock no macOS antes de criar a janela
  if (process.platform === "darwin") {
    const fs = require("fs");
    const candidates = [
      path.join(process.resourcesPath || "", "build", "icon.png"),
      path.join(app.getAppPath(), "build", "icon.png"),
      path.join(__dirname, "../build/icon.png"),
    ];
    const iconPath = candidates.find((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });
    
    if (iconPath) {
      try {
        const img = nativeImage.createFromPath(iconPath);
        if (!img.isEmpty()) {
          app.dock.setIcon(img);
          logger.debugTag("ELECTRON", "Ícone do Dock definido:", iconPath);
        } else {
          logger.warnTag("ELECTRON", "Imagem do ícone está vazia:", iconPath);
        }
      } catch (error) {
        logger.warnTag("ELECTRON", "Erro ao definir ícone do Dock:", error);
      }
    } else {
      logger.warnTag("ELECTRON", "Ícone do Dock não encontrado. Candidatos testados:", candidates);
    }
  }
  
  setupCSP();
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

