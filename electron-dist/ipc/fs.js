import { createRequire } from "module";
import * as fs from "fs/promises";
import * as path from "path";
const require = createRequire(import.meta.url);
const electron = require("electron");
const { ipcMain, app, dialog, shell } = electron;
export function registerIpcHandlers() {
    // AppData handlers (simplified API for database)
    ipcMain.handle("fs:ensureAppDataDir", async () => {
        try {
            const userDataDir = app.getPath("userData");
            await fs.mkdir(userDataDir, { recursive: true });
        }
        catch (error) {
            throw new Error(`Failed to ensure app data directory: ${error.message}`);
        }
    });
    ipcMain.handle("fs:readAppDataJson", async (_event, filename) => {
        try {
            if (typeof filename !== "string") {
                throw new Error("Filename must be a string");
            }
            const userDataDir = app.getPath("userData");
            const filePath = path.join(userDataDir, filename);
            try {
                const content = await fs.readFile(filePath, "utf-8");
                return content;
            }
            catch (error) {
                // File doesn't exist, return null
                if (error.code === "ENOENT") {
                    return null;
                }
                throw error;
            }
        }
        catch (error) {
            throw new Error(`Failed to read app data JSON: ${error.message}`);
        }
    });
    ipcMain.handle("fs:writeAppDataJson", async (_event, filename, content) => {
        try {
            if (typeof filename !== "string") {
                throw new Error("Filename must be a string");
            }
            if (typeof content !== "string") {
                throw new Error("Content must be a string");
            }
            const userDataDir = app.getPath("userData");
            await fs.mkdir(userDataDir, { recursive: true });
            const filePath = path.join(userDataDir, filename);
            await fs.writeFile(filePath, content, "utf-8");
        }
        catch (error) {
            throw new Error(`Failed to write app data JSON: ${error.message}`);
        }
    });
    // FS handlers
    ipcMain.handle("fs:exists", async (_event, filePath) => {
        try {
            if (typeof filePath !== "string") {
                throw new Error("Path must be a string");
            }
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    });
    ipcMain.handle("fs:readTextFile", async (_event, filePath) => {
        try {
            if (typeof filePath !== "string") {
                throw new Error("Path must be a string");
            }
            const content = await fs.readFile(filePath, "utf-8");
            return content;
        }
        catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    });
    ipcMain.handle("fs:writeTextFile", async (_event, filePath, content) => {
        try {
            if (typeof filePath !== "string") {
                throw new Error("Path must be a string");
            }
            if (typeof content !== "string") {
                throw new Error("Content must be a string");
            }
            await fs.writeFile(filePath, content, "utf-8");
        }
        catch (error) {
            throw new Error(`Failed to write file: ${error.message}`);
        }
    });
    ipcMain.handle("fs:mkdir", async (_event, dirPath, options) => {
        try {
            if (typeof dirPath !== "string") {
                throw new Error("Path must be a string");
            }
            await fs.mkdir(dirPath, { recursive: options?.recursive ?? true });
        }
        catch (error) {
            throw new Error(`Failed to create directory: ${error.message}`);
        }
    });
    // Path handlers
    ipcMain.handle("path:userDataDir", async () => {
        return app.getPath("userData");
    });
    ipcMain.handle("path:join", async (_event, ...paths) => {
        if (!Array.isArray(paths) || paths.some((p) => typeof p !== "string")) {
            throw new Error("All paths must be strings");
        }
        return path.join(...paths);
    });
    // Dialog handlers
    ipcMain.handle("dialog:open", async (_event, options) => {
        try {
            const result = await dialog.showOpenDialog({
                title: options?.title || "Selecionar arquivo",
                filters: options?.filters || [
                    { name: "Todos os arquivos", extensions: ["*"] },
                ],
                properties: options?.multiple ? ["openFile", "multiSelections"] : ["openFile"],
            });
            if (result.canceled) {
                return null;
            }
            return result.filePaths;
        }
        catch (error) {
            throw new Error(`Failed to open dialog: ${error.message}`);
        }
    });
    // External link handler
    ipcMain.handle("openExternal", async (_event, url) => {
        try {
            if (typeof url !== "string") {
                throw new Error("URL must be a string");
            }
            // Validar URL: permitir apenas http/https
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                throw new Error("Invalid URL: only http:// and https:// are allowed");
            }
            await shell.openExternal(url);
        }
        catch (error) {
            throw new Error(`Failed to open external URL: ${error.message}`);
        }
    });
    // App version handler
    ipcMain.handle("app:getVersion", async () => {
        try {
            return app.getVersion();
        }
        catch (error) {
            throw new Error(`Failed to get app version: ${error.message}`);
        }
    });
}
