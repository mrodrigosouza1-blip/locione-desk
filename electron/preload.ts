// Preload script - CommonJS format for Electron
try {
  const { contextBridge, ipcRenderer } = require("electron");
  const nodeCrypto = require("node:crypto");
  const nodeBuffer = require("node:buffer");

  function b64uToBuf(s: string): typeof nodeBuffer.Buffer {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return nodeBuffer.Buffer.from(s, "base64");
  }

  function verifyToken(token: string, publicKeySpkiB64: string): { ok: boolean; payloadJson?: string; error?: string } {
    try {
      const t = (token || "").trim();
      const parts = t.split(".");
      if (parts.length !== 3) return { ok: false, error: "Token inválido (formato)." };

      const [v, payloadEnc, sigEnc] = parts;
      if (v !== "LOCIONE1") return { ok: false, error: "Token inválido (versão)." };

      const payloadBytes = b64uToBuf(payloadEnc);
      const sigBytes = b64uToBuf(sigEnc);

      const pubDer = nodeBuffer.Buffer.from(publicKeySpkiB64, "base64");
      const pubKey = nodeCrypto.createPublicKey({ key: pubDer, format: "der", type: "spki" });

      const ok = nodeCrypto.verify(null, payloadBytes, pubKey, sigBytes);
      if (!ok) return { ok: false, error: "Assinatura inválida." };

      return { ok: true, payloadJson: payloadBytes.toString("utf8") };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Erro ao validar token." };
    }
  }

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
      ipcRenderer.send("app:lock");
    },
    getUserDataPath: (): Promise<string> => {
      return ipcRenderer.invoke("path:userDataDir");
    },
  });

  contextBridge.exposeInMainWorld("locione", {
    openExternal: (url: string): Promise<void> => {
      return ipcRenderer.invoke("openExternal", url);
    },
  });

  contextBridge.exposeInMainWorld("LociOne", {
    getAppVersion: (): Promise<string> => {
      return ipcRenderer.invoke("app:getVersion");
    },
  });

  console.log("[preload] locioneCrypto loaded");
  contextBridge.exposeInMainWorld("locioneCrypto", { verifyToken });
} catch (e: any) {
  console.error("[preload] failed", e);
}
