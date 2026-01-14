interface ElectronAPI {
  ensureAppDataDir(): Promise<void>;
  readAppDataJson(filename: string): Promise<string | null>;
  writeAppDataJson(filename: string, content: string): Promise<void>;
  onAppLock(callback: () => void): void;
  requestLock(): void;
  getUserDataPath(): Promise<string>;
}

interface LociOneAPI {
  getAppVersion(): Promise<string>;
}

interface LocioneCryptoAPI {
  verifyToken(
    token: string,
    publicKeySpkiB64: string
  ): { ok: boolean; payloadJson?: string; error?: string };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    LociOne?: LociOneAPI;
    locioneCrypto?: LocioneCryptoAPI;
  }
}

export {};
