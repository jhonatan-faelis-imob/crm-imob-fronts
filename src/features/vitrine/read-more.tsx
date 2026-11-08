'use client'

import { useState } from 'react'

// O texto completo já vem no HTML do servidor; o botão só tira o corte visual
export function ReadMore({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const long = text.length > 320

  return (
    <div>
      <p className={`whitespace-pre-line text-[17px] leading-[1.7] text-neutral-600 ${!expanded && long ? 'line-clamp-6' : ''}`}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-2 min-h-11 text-[15px] font-semibold text-brand"
        >
          {expanded ? 'Ler menos' : 'Ler mais'}
        </button>
      )}
    </div>
  )
}
