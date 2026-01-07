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

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    LociOne?: LociOneAPI;
  }
}

export {};
