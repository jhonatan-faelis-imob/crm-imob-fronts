import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

// Falso no servidor e na primeira renderização do cliente, para o HTML das duas coincidir
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
