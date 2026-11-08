'use client'

import { useLayoutEffect } from 'react'

export const REVEAL_EVENT = 'lp:reveal'

const TARGETS = '[data-landing] [data-reveal], [data-landing] [data-reveal-stagger]'

// Um único IntersectionObserver para a LP: põe .is-visible em [data-reveal] e [data-reveal-stagger]
// uma vez só e avisa os CountUp do bloco com o evento lp:reveal.
export function RevealObserver() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    // O script inline do layout já faz isso no primeiro carregamento; aqui cobre a navegação client-side
    if (motion) root.classList.add('motion-ready')

    const targets = Array.from(document.querySelectorAll<HTMLElement>(TARGETS))
    for (const el of targets) {
      const delay = el.dataset.revealDelay
      if (delay) el.style.setProperty('--reveal-delay', `${Number(delay)}ms`)
      const stagger = el.dataset.revealStagger
      if (stagger === undefined) continue
      if (stagger) el.style.setProperty('--stagger', `${Number(stagger)}ms`)
      const items = Array.from(el.querySelectorAll<HTMLElement>('[data-stagger-item]')).filter(
        (item) => item.parentElement?.closest('[data-reveal-stagger]') === el,
      )
      items.forEach((item, index) => {
        if (!item.style.getPropertyValue('--i')) item.style.setProperty('--i', String(index))
      })
    }

    const show = (el: Element) => {
      el.classList.add('is-visible')
      el.dispatchEvent(new Event(REVEAL_EVENT))
    }

    if (!motion || !('IntersectionObserver' in window)) {
      targets.forEach(show)
      return () => root.classList.remove('motion-ready')
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          show(entry.target)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.2 },
    )
    targets.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      root.classList.remove('motion-ready')
    }
  }, [])

  return null
}
