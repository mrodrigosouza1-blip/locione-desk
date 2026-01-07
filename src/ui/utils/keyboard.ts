/**
 * Verifica se o elemento alvo é editável (input, textarea, select, contenteditable)
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  const element = target as HTMLElement;

  // Verificar se é input, textarea ou select
  const tagName = element.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }

  // Verificar se tem contenteditable="true"
  if (element.getAttribute("contenteditable") === "true") {
    return true;
  }

  // Verificar se está dentro de um elemento contenteditable
  let parent = element.parentElement;
  while (parent) {
    if (parent.getAttribute("contenteditable") === "true") {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

