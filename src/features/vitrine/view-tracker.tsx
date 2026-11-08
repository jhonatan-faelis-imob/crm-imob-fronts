'use client'

import { useEffect } from 'react'
import { propertySharesService } from '@/services/property-shares.service'

// Conta a visita uma vez por sessão do navegador: atualizar a página na mesma aba não soma de novo.
// fetch puro com keepalive (não passa pelo api.ts, que redirecionaria para o login)
export function ViewTracker({ token }: { token: string }) {
  useEffect(() => {
    const key = `share-viewed:${token}`
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, '1')
    } catch {
      // Sem sessionStorage (modo restrito): conta mesmo assim
    }
    void propertySharesService.recordView(token)
  }, [token])

  return null
}
