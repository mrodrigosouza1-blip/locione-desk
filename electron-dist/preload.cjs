"use strict";
// Preload script - CommonJS format for Electron
try {
    const { contextBridge, ipcRenderer } = require("electron");
    const nodeCrypto = require("node:crypto");
    const nodeBuffer = require("node:buffer");
    function b64uToBuf(s) {
        s = s.replace(/-/g, "+").replace(/_/g, "/");
        while (s.length % 4)
            s += "=";
        return nodeBuffer.Buffer.from(s, "base64");
    }
    function verifyToken(token, publicKeySpkiB64) {
        try {
            const t = (token || "").trim();
            const parts = t.split(".");
            if (parts.length !== 3)
                return { ok: false, error: "Token inválido (formato)." };
            const [v, payloadEnc, sigEnc] = parts;
            if (v !== "LOCIONE1")
                return { ok: false, error: "Token inválido (versão)." };
            const payloadBytes = b64uToBuf(payloadEnc);
            const sigBytes = b64uToBuf(sigEnc);
            const pubDer = nodeBuffer.Buffer.from(publicKeySpkiB64, "base64");
            const pubKey = nodeCrypto.createPublicKey({ key: pubDer, format: "der", type: "spki" });
            const ok = nodeCrypto.verify(null, payloadBytes, pubKey, sigBytes);
            if (!ok)
                return { ok: false, error: "Assinatura inválida." };
            return { ok: true, payloadJson: payloadBytes.toString("utf8") };
        }
        catch (e) {
            return { ok: false, error: e?.message || "Erro ao validar token." };
        }
    }
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
            ipcRenderer.send("app:lock");
        },
        getUserDataPath: () => {
            return ipcRenderer.invoke("path:userDataDir");
        },
    });
    contextBridge.exposeInMainWorld("locione", {
        openExternal: (url) => {
            return ipcRenderer.invoke("openExternal", url);
        },
    });
    contextBridge.exposeInMainWorld("LociOne", {
        getAppVersion: () => {
            return ipcRenderer.invoke("app:getVersion");
        },
    });
    console.log("[preload] locioneCrypto loaded");
    contextBridge.exposeInMainWorld("locioneCrypto", { verifyToken });
}
catch (e) {
    console.error("[preload] failed", e);
}
