/**
 * Helper para aplicar gates com UX (toast + navegação)
 */

import { checkGate, type GateKey } from "./planGate";
import type { GateContext } from "./usageCounters";

interface ToastFn {
  error: (message: string) => void;
}

interface TranslateFn {
  (key: string): string;
}

interface NavigateFn {
  (path: string): void;
}

/**
 * Requer que um gate esteja aberto. Se bloqueado, mostra toast e opcionalmente navega.
 * Retorna true se permitido, false se bloqueado.
 */
export function requireGate(
  gate: GateKey,
  ctx: GateContext,
  toastFn: ToastFn,
  _navigateFn?: NavigateFn,
  t?: TranslateFn
): boolean {
  const result = checkGate(gate, ctx);
  
  if (result.ok) {
    return true;
  }
  
  // Construir mensagem com título e texto
  let message = "";
  if (result.title && t) {
    const title = t(result.title);
    const reason = result.reason ? t(result.reason) : "";
    // Se tiver título e mensagem, combinar; senão usar apenas a mensagem
    if (title && reason) {
      message = `${title}\n${reason}`;
    } else if (reason) {
      message = reason;
    } else if (title) {
      message = title;
    } else {
      message = t("gate.generic.message");
    }
  } else {
    message = result.reason || "Este recurso está disponível no plano Premium.";
  }
  
  toastFn.error(message);
  
  // NÃO navegar automaticamente - apenas mostrar mensagem
  // A navegação deve ser opcional e controlada pelo usuário (botão "Ver planos")
  // Se precisar navegar, passar navigateFn e chamar manualmente quando necessário
  
  return false;
}

