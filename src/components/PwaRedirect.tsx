'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function PwaRedirect() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isPwa = params.get('source') === 'pwa'

    if (!isPwa) return

    // Remove o parâmetro da URL sem recarregar
    const cleanUrl = window.location.pathname
    window.history.replaceState({}, '', cleanUrl)

    // accessToken é o nome usado por src/store/auth.store.ts (localStorage + cookie espelhado)
    const token = localStorage.getItem('accessToken') || getCookie('accessToken')

    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])

  return null
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}
