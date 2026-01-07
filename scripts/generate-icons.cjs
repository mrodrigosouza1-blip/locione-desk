#!/usr/bin/env node

/**
 * Script para gerar ícones do aplicativo a partir de app-icon-1024.png
 * Gera: icon.png, icon.ico (Windows), icon.icns (macOS)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const inputPath = path.join(__dirname, "../src/assets/brand/app-icon-1024.png");
const buildDir = path.join(__dirname, "../build");

// Verificar se o arquivo de entrada existe
if (!fs.existsSync(inputPath)) {
  console.error("❌ Arquivo não encontrado:", inputPath);
  console.error("   Por favor, coloque app-icon-1024.png em src/assets/brand/");
  process.exit(1);
}

// Criar pasta build se não existir
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copiar para icon.png (usar o 1024x1024 como base)
const outputPng = path.join(buildDir, "icon.png");
try {
  fs.copyFileSync(inputPath, outputPng);
  console.log("✅ Gerado:", outputPng);
} catch (error) {
  console.error("❌ Erro ao copiar icon.png:", error.message);
  process.exit(1);
}

// Gerar icon.icns (macOS) usando iconutil (mais confiável que sips)
const outputIcns = path.join(buildDir, "icon.icns");
if (process.platform === "darwin") {
  try {
    // iconutil requer um diretório .iconset com múltiplos tamanhos
    // Por enquanto, tentar sips primeiro, se falhar, usar iconutil com tamanhos padrão
    try {
      execSync(`sips -s format icns "${inputPath}" --out "${outputIcns}"`, {
        stdio: "pipe",
      });
      if (fs.existsSync(outputIcns)) {
        console.log("✅ Gerado:", outputIcns, "(via sips)");
      } else {
        throw new Error("sips não gerou o arquivo");
      }
    } catch {
      // Fallback: usar imagem direta (electron-builder aceita PNG também)
      console.log("⚠️  icon.icns não gerado via sips");
      console.log("   O electron-builder pode usar icon.png como fallback");
      console.log("   Para gerar manualmente: pnpm add -D electron-icon-builder");
    }
  } catch (error) {
    console.warn("⚠️  icon.icns não gerado:", error.message);
  }
} else {
  console.log("⚠️  icon.icns não gerado (requer macOS)");
  console.log("   O electron-builder pode usar icon.png como fallback");
}

// Tentar gerar icon.ico (Windows) usando electron-icon-builder se disponível
const outputIco = path.join(buildDir, "icon.ico");
try {
  // Verificar se electron-icon-builder está disponível
  try {
    require.resolve("electron-icon-builder");
    execSync(
      `npx electron-icon-builder --input="${inputPath}" --output="${buildDir}" --flatten`,
      { stdio: "pipe" }
    );
    // electron-icon-builder gera icon.ico automaticamente
    if (fs.existsSync(outputIco)) {
      console.log("✅ Gerado:", outputIco);
    } else {
      console.log("⚠️  icon.ico não gerado pelo electron-icon-builder");
    }
  } catch {
    // Se electron-icon-builder não estiver instalado, apenas avisar
    console.log("⚠️  icon.ico não gerado (electron-icon-builder não instalado)");
    console.log("   Para gerar: pnpm add -D electron-icon-builder");
    console.log("   Ou use ferramentas online: https://convertio.co/pt/png-ico/");
  }
} catch (error) {
  console.warn("⚠️  Erro ao gerar icon.ico:", error.message);
}

console.log("\n✅ Geração de ícones concluída!");

