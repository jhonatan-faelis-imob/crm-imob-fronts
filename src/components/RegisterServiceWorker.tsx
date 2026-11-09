'use client'

import { useEffect } from 'react'

const DEV_CLEANUP_KEY = 'sw-dev-cleanup'

// Em desenvolvimento um service worker de um build antigo (mesma origem, localhost) continua servindo JS velho
// e causa "Hydration failed". Remove os registros, limpa os caches e recarrega uma vez se ele controlava a página.
async function removeServiceWorkers() {
  const hadController = navigator.serviceWorker.controller !== null
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
  if (typeof caches !== 'undefined') {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
  if (!hadController && registrations.length === 0) return
  try {
    if (sessionStorage.getItem(DEV_CLEANUP_KEY)) return
    sessionStorage.setItem(DEV_CLEANUP_KEY, '1')
  } catch {
    return
  }
  if (hadController) window.location.reload()
}

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') {
      removeServiceWorkers().catch(() => {})
      return
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  return null
}
