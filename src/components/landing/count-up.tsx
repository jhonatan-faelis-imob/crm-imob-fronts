'use client'

import { useEffect, useRef, useState } from 'react'
import { REVEAL_EVENT } from './reveal-observer'

type CountUpProps = {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  /** Espera depois de o bloco aparecer, em ms */
  delay?: number
  duration?: number
}

function format(value: number, decimals: number, prefix: string, suffix: string) {
  const number = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
  return `${prefix}${number}${suffix}`
}

// O servidor renderiza o valor final. A contagem fica numa camada por cima do valor final
// (invisível, mas ocupando o espaço e lido por leitores de tela): zero layout shift.
export function CountUp({ value, decimals = 0, prefix = '', suffix = '', delay = 0, duration = 900 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [current, setCurrent] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const motion =
      document.documentElement.classList.contains('motion-ready') &&
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    if (!motion) return

    let frame = 0
    let timer = 0
    const factor = 10 ** decimals

    const run = () => {
      frame = requestAnimationFrame(() => {
        setCurrent(0)
        timer = window.setTimeout(() => {
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration)
            const eased = 1 - (1 - progress) ** 3
            if (progress >= 1) {
              setCurrent(null)
              return
            }
            setCurrent(Math.round(value * eased * factor) / factor)
            frame = requestAnimationFrame(tick)
          }
          frame = requestAnimationFrame(tick)
        }, delay)
      })
    }

    const host = el.closest<HTMLElement>('[data-reveal], [data-reveal-stagger], [data-hero]')
    if (!host || host.hasAttribute('data-hero') || host.classList.contains('is-visible')) {
      run()
    } else {
      host.addEventListener(REVEAL_EVENT, run, { once: true })
    }

    return () => {
      host?.removeEventListener(REVEAL_EVENT, run)
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [value, decimals, delay, duration])

  const finalText = format(value, decimals, prefix, suffix)
  const animating = current !== null

  return (
    <span ref={ref} className="relative inline-block whitespace-nowrap">
      <span style={animating ? { opacity: 0 } : undefined}>{finalText}</span>
      {animating && (
        <span aria-hidden="true" className="absolute inset-0">
          {format(current, decimals, prefix, suffix)}
        </span>
      )}
    </span>
  )
}
