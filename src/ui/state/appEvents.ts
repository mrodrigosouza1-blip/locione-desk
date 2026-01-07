/**
 * Sistema simples de eventos para notificar mudanças de dados
 * Permite que componentes escutem mudanças e atualizem automaticamente
 */

type AppEvent = "data:changed";

type EventListener = () => void;

const listeners = new Set<EventListener>();

/**
 * Emite um evento de mudança de dados
 * Deve ser chamado após criar/editar/remover transações, cartões, contas, etc.
 */
export function emitAppEvent(_event: AppEvent): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("[AppEvents] Erro ao executar listener:", error);
    }
  });
}

/**
 * Registra um listener para eventos de mudança de dados
 * Retorna função para remover o listener
 */
export function onAppEvent(_event: AppEvent, listener: EventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

