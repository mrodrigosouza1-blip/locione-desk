// Preload script - CommonJS format for Electron
var _a = require("electron"), contextBridge = _a.contextBridge, ipcRenderer = _a.ipcRenderer;
contextBridge.exposeInMainWorld("electronAPI", {
    ensureAppDataDir: function () {
        return ipcRenderer.invoke("fs:ensureAppDataDir");
    },
    readAppDataJson: function (filename) {
        return ipcRenderer.invoke("fs:readAppDataJson", filename);
    },
    writeAppDataJson: function (filename, content) {
        return ipcRenderer.invoke("fs:writeAppDataJson", filename, content);
    },
});
