'use client'

import { useEffect, useRef } from 'react'

// Sentinela de 8px no topo: quando sai da tela, a nav ganha data-scrolled (sombra e blur via motion.css).
// IntersectionObserver em vez de listener de scroll.
export function NavScrollState() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = ref.current
    const nav = document.querySelector<HTMLElement>('[data-landing] .lp-nav')
    if (!sentinel || !nav || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(([entry]) => {
      nav.toggleAttribute('data-scrolled', !entry.isIntersecting)
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-2 w-px" />
}
