const { execSync, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Script para limpar detritos do macOS (resource forks, extended attributes)
 * Roda apenas em darwin
 * Remove arquivos ._* e __MACOSX, limpa extended attributes e executa dot_clean
 * 
 * Hook: afterPack (executa ANTES do codesign)
 */
module.exports = async function cleanMacOSDetritus(context) {
  // Apenas rodar no macOS
  if (process.platform !== "darwin") {
    console.log("[clean-macos] Skipping cleanup (not macOS)");
    return;
  }

  console.log("[clean-macos] Starting macOS detritus cleanup...");

  // Localizar o .app
  const appOutDir = context.appOutDir;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  // Validar que appPath existe
  if (!fs.existsSync(appPath)) {
    throw new Error(`[clean-macos] App path does not exist: ${appPath}`);
  }

  console.log("[clean-macos] Cleaning app:", appPath);

  try {
    // 1. Remover arquivos AppleDouble (._*)
    console.log("[clean-macos] Removing AppleDouble files (._*)...");
    try {
      execSync(`find "${appPath}" -name "._*" -delete`, { stdio: "inherit" });
    } catch (error) {
      // Ignorar se não encontrar (find retorna exit code 1 se não encontrar nada)
      if (error.status !== 1) {
        throw new Error(`[clean-macos] Failed to remove ._* files: ${error.message}`);
      }
    }

    // 2. Remover pasta "__MACOSX" se existir
    console.log("[clean-macos] Removing __MACOSX directories...");
    try {
      execSync(`find "${appPath}" -name "__MACOSX" -prune -exec rm -rf {} +`, { stdio: "inherit" });
    } catch (error) {
      // Ignorar se não encontrar
      if (error.status !== 1) {
        throw new Error(`[clean-macos] Failed to remove __MACOSX: ${error.message}`);
      }
    }

    // 3. Limpar extended attributes recursivamente
    console.log("[clean-macos] Clearing extended attributes (xattr -cr)...");
    try {
      execSync(`xattr -cr "${appPath}"`, { stdio: "inherit" });
    } catch (error) {
      throw new Error(`[clean-macos] Failed to clear extended attributes: ${error.message}`);
    }

    // 4. Executar dot_clean para limpar resource forks (opcional)
    console.log("[clean-macos] Running dot_clean (optional)...");
    try {
      execFileSync("dot_clean", ["-m", appPath], { stdio: "inherit" });
      console.log("[clean-macos] dot_clean completed successfully");
    } catch (error) {
      // Se dot_clean não estiver disponível (ENOENT), apenas logar warning e continuar
      if (error.code === "ENOENT") {
        console.warn("[clean-macos] dot_clean not found in PATH, skipping (this is optional)");
      } else {
        // Outros erros também são tratados como warning (não quebra o build)
        console.warn(`[clean-macos] dot_clean failed (non-fatal): ${error.message}`);
      }
    }

    console.log("[clean-macos] Cleanup completed successfully");
  } catch (error) {
    console.error("[clean-macos] Error during cleanup:", error);
    throw error;
  }
};
