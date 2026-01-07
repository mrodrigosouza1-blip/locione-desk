"use strict";
// Preload script - CommonJS format for Electron
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
    ensureAppDataDir: () => {
        return ipcRenderer.invoke("fs:ensureAppDataDir");
    },
    readAppDataJson: (filename) => {
        return ipcRenderer.invoke("fs:readAppDataJson", filename);
    },
    writeAppDataJson: (filename, content) => {
        return ipcRenderer.invoke("fs:writeAppDataJson", filename, content);
    },
    onAppLock: (callback) => {
        ipcRenderer.on("app:lock", () => {
            callback();
        });
    },
    requestLock: () => {
        // Enviar evento de lock (opcional, pode ser usado manualmente)
        ipcRenderer.send("app:lock");
    },
});
