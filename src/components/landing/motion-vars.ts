import type { CSSProperties } from 'react'

type MotionVars = {
  /** Atraso da peça, em ms */
  d?: number
  /** Índice no stagger (sobrepõe o calculado pelo RevealObserver) */
  i?: number
  /** Nome do @keyframes de motion.css (ex.: lp-bar, lp-pop, lp-dot) */
  anim?: string
  /** Duração, em ms */
  dur?: number
  /** Atraso do check que se desenha, em ms */
  draw?: number
  /** Atraso do anel do card destacado do Kanban, em ms */
  ring?: number
}

// Variáveis CSS lidas por motion.css. Só servem para o movimento: sem elas, o estado final é o mesmo.
export function motionVars({ d, i, anim, dur, draw, ring }: MotionVars): CSSProperties {
  const style: Record<string, string> = {}
  if (d !== undefined) style['--d'] = `${d}ms`
  if (i !== undefined) style['--i'] = String(i)
  if (anim !== undefined) style['--lp-anim'] = anim
  if (dur !== undefined) style['--lp-dur'] = `${dur}ms`
  if (draw !== undefined) style['--draw-delay'] = `${draw}ms`
  if (ring !== undefined) style['--ring-d'] = `${ring}ms`
  return style as CSSProperties
}
