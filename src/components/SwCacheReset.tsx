'use client'

import { useEffect } from 'react'

export function SwCacheReset() {
  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        // Apaga apenas caches de páginas que possam ter sido cacheadas incorretamente
        names
          .filter(name => name.includes('pages-cache') || name.includes('auth-pages'))
          .forEach(name => caches.delete(name))
      })
    }
  }, [])

  return null
}
