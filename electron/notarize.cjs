const { notarize } = require("@electron/notarize");
const { execSync } = require("child_process");
const path = require("path");

/**
 * Script de notarização para macOS
 * Roda apenas em darwin e quando FORCE_NOTARIZE=1
 */
module.exports = async function afterSign(context) {
  const { electronPlatformName } = context;
  
  // Apenas rodar no macOS
  if (electronPlatformName !== "darwin") {
    console.log("[notarize] Skipping notarization (not macOS)");
    return;
  }

  // Apenas rodar quando FORCE_NOTARIZE=1
  if (process.env.FORCE_NOTARIZE !== "1") {
    console.log("[notarize] Skipping notarization (FORCE_NOTARIZE not set to '1')");
    return;
  }

  console.log("[notarize] Starting notarization process...");

  // Obter variáveis de ambiente
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  // Validar que todas as variáveis existem
  if (!appleId || !appleIdPassword || !teamId) {
    console.warn("[notarize] Missing required environment variables for notarization:");
    if (!appleId) console.warn("  - APPLE_ID is not set");
    if (!appleIdPassword) console.warn("  - APPLE_APP_SPECIFIC_PASSWORD is not set");
    if (!teamId) console.warn("  - APPLE_TEAM_ID is not set");
    console.warn("[notarize] Skipping notarization (build will continue without notarization)");
    return;
  }

  // Localizar o .app
  const appOutDir = context.appOutDir;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  // Bundle ID consistente com appId do electron-builder
  const appBundleId = "com.locione.locione-desk";

  console.log("[notarize] App path:", appPath);
  console.log("[notarize] App Bundle ID:", appBundleId);
  console.log("[notarize] Apple ID:", appleId);
  console.log("[notarize] Team ID:", teamId);

  try {
    // Notarizar
    console.log("[notarize] Submitting app for notarization...");
    await notarize({
      appBundleId,
      appPath,
      appleId,
      appleIdPassword,
      teamId,
    });

    console.log("[notarize] Notarization successful!");

    // Stapler (anexar ticket de notarização)
    console.log("[notarize] Stapling notarization ticket...");
    execSync(`xcrun stapler staple -v "${appPath}"`, {
      stdio: "inherit",
    });

    console.log("[notarize] Stapling successful!");
    console.log("[notarize] Notarization process completed successfully");
  } catch (error) {
    console.error("[notarize] Notarization failed:", error);
    throw error;
  }
};
