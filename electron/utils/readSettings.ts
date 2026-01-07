// Utilitário para ler settings do banco JSON no processo main do Electron
import * as fs from "fs/promises";
import * as path from "path";
import { app } from "electron";
import { logger } from "./logger.js";

export async function readSettingsFromDatabase(): Promise<any> {
  try {
    const userDataDir = app.getPath("userData");
    const dbPath = path.join(userDataDir, "database.json");
    
    try {
      const content = await fs.readFile(dbPath, "utf-8");
      const db = JSON.parse(content);
      return db.settings || null;
    } catch (error: any) {
      // Se arquivo não existe ou está corrompido, retornar null
      if (error.code === "ENOENT") {
        return null;
      }
      logger.warnTag("ELECTRON", "Erro ao ler settings:", error);
      return null;
    }
  } catch (error) {
    logger.warnTag("ELECTRON", "Erro ao acessar userData:", error);
    return null;
  }
}

export async function getLockOnMinimizeSetting(): Promise<boolean> {
  const settings = await readSettingsFromDatabase();
  if (!settings) return false;
  
  // Suportar formato antigo e novo
  if (settings.security && typeof settings.security === "object") {
    return settings.security.lockOnMinimize === true;
  }
  
  return false;
}

