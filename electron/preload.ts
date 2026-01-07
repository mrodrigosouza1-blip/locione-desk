// Preload script - CommonJS format for Electron
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  ensureAppDataDir: (): Promise<void> => {
    return ipcRenderer.invoke("fs:ensureAppDataDir");
  },
  readAppDataJson: (filename: string): Promise<string | null> => {
    return ipcRenderer.invoke("fs:readAppDataJson", filename);
  },
  writeAppDataJson: (filename: string, content: string): Promise<void> => {
    return ipcRenderer.invoke("fs:writeAppDataJson", filename, content);
  },
  onAppLock: (callback: () => void): void => {
    ipcRenderer.on("app:lock", () => {
      callback();
    });
  },
  requestLock: (): void => {
    // Enviar evento de lock (opcional, pode ser usado manualmente)
    ipcRenderer.send("app:lock");
  },
  getUserDataPath: (): Promise<string> => {
    return ipcRenderer.invoke("path:userDataDir");
  },
});

// Expor API do LociOne (compatibilidade com window.locione)
contextBridge.exposeInMainWorld("locione", {
  openExternal: (url: string): Promise<void> => {
    return ipcRenderer.invoke("openExternal", url);
  },
});

// Expor API do LociOne (window.LociOne)
contextBridge.exposeInMainWorld("LociOne", {
  getAppVersion: (): Promise<string> => {
    return ipcRenderer.invoke("app:getVersion");
  },
});
