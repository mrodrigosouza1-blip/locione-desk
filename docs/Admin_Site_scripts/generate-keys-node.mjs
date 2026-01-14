#!/usr/bin/env node
/**
 * Script para gerar par de chaves Ed25519 usando Node.js crypto
 * 
 * Uso:
 *   node generate-keys-node.mjs
 * 
 * Saída:
 *   PRIVATE_KEY_ED25519=... (raw base64)
 *   SITE_PUBLIC_KEY_ED25519=... (SPKI DER base64)
 */

import { generateKeyPairSync } from 'crypto';
import { writeFileSync } from 'fs';

try {
  console.log('Gerando par de chaves Ed25519 usando Node.js crypto...\n');
  
  // Gerar par de chaves Ed25519
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });
  
  // Extrair chave privada raw (últimos 32 bytes do PKCS8)
  const privateKeyRaw = privateKey.slice(-32);
  
  // Converter para base64
  const privateKeyBase64 = privateKeyRaw.toString('base64');
  const publicKeyBase64 = publicKey.toString('base64');
  
  console.log('✅ Par de chaves gerado com sucesso!\n');
  console.log('Copie estas variáveis para o .env do servidor:\n');
  console.log(`PRIVATE_KEY_ED25519=${privateKeyBase64}`);
  console.log(`SITE_PUBLIC_KEY_ED25519=${publicKeyBase64}\n`);
  console.log('⚠️  IMPORTANTE: Guarde a PRIVATE_KEY_ED25519 em local seguro!');
  console.log('⚠️  A SITE_PUBLIC_KEY_ED25519 deve ser copiada para o app (src/services/licensePublicKey.ts)\n');
  
} catch (error) {
  console.error('❌ Erro ao gerar chaves:', error.message);
  process.exit(1);
}
