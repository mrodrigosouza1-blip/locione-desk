/**
 * Setup do Ed25519 para configurar SHA-512
 * Compatível com versões antigas e novas do @noble/ed25519
 */

import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";

let isSetup = false;

/**
 * Configura SHA-512 para @noble/ed25519
 * Função idempotente - só executa uma vez
 */
export function ensureEd25519(): void {
  if (isSetup) {
    return;
  }

  // API nova (hashes.sha512) - versão 3.0.0+
  if ((ed as any).hashes) {
    (ed as any).hashes.sha512 = sha512;
    // sha512Async é opcional, mas configuramos para garantir compatibilidade
    if (!(ed as any).hashes.sha512Async) {
      (ed as any).hashes.sha512Async = (m: Uint8Array) => Promise.resolve(sha512(m));
    }
  }
  // API antiga (etc.sha512Sync) - versões anteriores
  else if ((ed as any).etc) {
    (ed as any).etc.sha512Sync = (...m: Uint8Array[]) => sha512((ed as any).etc.concatBytes(...m));
    (ed as any).etc.sha512Async = (...m: Uint8Array[]) =>
      Promise.resolve(sha512((ed as any).etc.concatBytes(...m)));
  }

  isSetup = true;
}

