#!/usr/bin/env node
/**
 * Script para verificar token LOCIONE1
 * 
 * Uso:
 *   export SITE_PUBLIC_KEY_ED25519="..."
 *   node verify-locione.mjs "LOCIONE1.xxx.yyy"
 */

import { createVerify } from 'crypto';
import { Buffer } from 'buffer';

const token = process.argv[2];
const publicKeyBase64 = process.env.SITE_PUBLIC_KEY_ED25519;

if (!token) {
  console.error('❌ Uso: node verify-locione.mjs "LOCIONE1.xxx.yyy"');
  process.exit(1);
}

if (!publicKeyBase64) {
  console.error('❌ SITE_PUBLIC_KEY_ED25519 não definido. Exporte a variável de ambiente:');
  console.error('   export SITE_PUBLIC_KEY_ED25519="..."');
  process.exit(1);
}

try {
  // Parse token
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'LOCIONE1') {
    console.error('❌ Formato de token inválido. Esperado: LOCIONE1.<payload>.<signature>');
    process.exit(1);
  }
  
  const [prefix, payloadB64url, sigB64url] = parts;
  
  // Decodificar payload
  const payloadBase64 = payloadB64url.replace(/-/g, '+').replace(/_/g, '/');
  const payloadBytes = Buffer.from(payloadBase64, 'base64');
  const payloadJson = payloadBytes.toString('utf8');
  const payload = JSON.parse(payloadJson);
  
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  
  // Decodificar assinatura
  const sigBase64 = sigB64url.replace(/-/g, '+').replace(/_/g, '/');
  const signatureBytes = Buffer.from(sigBase64, 'base64');
  
  // Importar chave pública
  const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');
  
  // Verificar assinatura
  // A assinatura é feita sobre os bytes do JSON do payload (não base64url, não "LOCIONE1...")
  const verify = createVerify('Ed25519');
  verify.update(payloadJson, 'utf8');
  const isValid = verify.verify({
    key: publicKeyDer,
    format: 'der',
    type: 'spki'
  }, signatureBytes);
  
  if (isValid) {
    console.log('\n✅ Assinatura válida!');
    
    // Validações adicionais
    if (payload.product !== 'locione-desk') {
      console.log('❌ Produto incompatível. Esperado: locione-desk');
      process.exit(1);
    }
    
    if (payload.expires_at !== null) {
      const expiresAt = new Date(payload.expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        console.log('❌ Licença expirada');
        process.exit(1);
      }
      console.log(`✅ Licença válida até: ${expiresAt.toISOString()}`);
    } else {
      console.log('✅ Licença sem expiração (lifetime)');
    }
    
    console.log(`✅ Plano: ${payload.plan}`);
    console.log(`✅ Max devices: ${payload.max_devices}`);
    
  } else {
    console.log('\n❌ Assinatura inválida');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Erro ao verificar token:', error.message);
  process.exit(1);
}
