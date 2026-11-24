import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'kanban-mobile-hint-dismissed'
const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

let dismissedInMemory = false

function isDismissed(): boolean {
  if (dismissedInMemory) return true
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// Aviso de "segure para arrastar": aparece até ser fechado, uma vez só por aparelho
export function useKanbanHint() {
  // No servidor devolve "já fechado" para o aviso não entrar no HTML inicial
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true)

  function dismiss() {
    dismissedInMemory = true
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // localStorage indisponível (modo privado): o aviso some só até recarregar
    }
    listeners.forEach((listener) => listener())
  }

  return { showHint: !dismissed, dismiss }
}
