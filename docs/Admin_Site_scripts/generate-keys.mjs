#!/usr/bin/env node
/**
 * Script para gerar par de chaves Ed25519 para o sistema de licenças LOCIONE
 * 
 * Uso:
 *   node generate-keys.mjs
 * 
 * Saída:
 *   PRIVATE_KEY_ED25519=... (raw base64)
 *   SITE_PUBLIC_KEY_ED25519=... (SPKI DER base64)
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

try {
  // Gerar par de chaves Ed25519 usando openssl
  console.log('Gerando par de chaves Ed25519...\n');
  
  // Gerar chave privada (raw 32 bytes)
  const privateKeyRaw = execSync('openssl genpkey -algorithm Ed25519 -outform DER 2>/dev/null | tail -c 32 | base64', {
    encoding: 'utf8',
    shell: true
  }).trim();
  
  // Gerar chave pública SPKI DER
  // Primeiro, criar um arquivo temporário com a chave privada
  const tempPrivateKey = execSync('openssl genpkey -algorithm Ed25519 -outform PEM 2>/dev/null', {
    encoding: 'utf8',
    shell: true
  });
  
  // Extrair chave pública SPKI DER
  const publicKeySpkiDer = execSync(`echo "${tempPrivateKey}" | openssl pkey -pubout -outform DER 2>/dev/null | base64`, {
    encoding: 'utf8',
    shell: true
  }).trim();
  
  console.log('✅ Par de chaves gerado com sucesso!\n');
  console.log('Copie estas variáveis para o .env do servidor:\n');
  console.log(`PRIVATE_KEY_ED25519=${privateKeyRaw}`);
  console.log(`SITE_PUBLIC_KEY_ED25519=${publicKeySpkiDer}\n`);
  console.log('⚠️  IMPORTANTE: Guarde a PRIVATE_KEY_ED25519 em local seguro!');
  console.log('⚠️  A SITE_PUBLIC_KEY_ED25519 deve ser copiada para o app (src/services/licensePublicKey.ts)\n');
  
} catch (error) {
  console.error('❌ Erro ao gerar chaves:', error.message);
  console.error('\nAlternativa usando Node.js crypto (não requer openssl):');
  console.error('Use o script generate-keys-node.mjs');
  process.exit(1);
}
