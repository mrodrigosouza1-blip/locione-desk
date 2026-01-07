import { useEffect, useRef } from "react";
import { isEditableTarget } from "../utils/keyboard";

interface GlobalShortcutsActions {
  goSettings: () => void;
  goLicense: () => void;
  openQuickActions: () => void;
}

/**
 * Hook para gerenciar atalhos de teclado globais
 */
export function useGlobalShortcuts(actions: GlobalShortcutsActions) {
  // Usar ref para evitar re-criação do handler quando actions mudarem
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Não interceptar se estiver em elemento editável
      if (isEditableTarget(e.target)) {
        return;
      }

      // Não interceptar se já foi prevenido por outro handler
      if (e.defaultPrevented) {
        return;
      }

      // Só interceptar se Ctrl (Windows/Linux) ou Cmd (Mac) estiver pressionado
      if (!(e.ctrlKey || e.metaKey)) {
        return;
      }

      // Normalizar tecla para lowercase
      const key = e.key.toLowerCase();

      // Atalhos
      if (key === "," || key === "comma") {
        e.preventDefault();
        actionsRef.current.goSettings();
        return;
      }

      if (key === "l") {
        e.preventDefault();
        actionsRef.current.goLicense();
        return;
      }

      if (key === "k") {
        e.preventDefault();
        actionsRef.current.openQuickActions();
        return;
      }
    }

    // Usar capture: true para interceptar antes de outros handlers
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []); // Array vazio - actions são acessadas via ref
}

