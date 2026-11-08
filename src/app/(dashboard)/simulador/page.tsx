'use client'

import { Simulator } from '@/features/simulador/components/simulator'

// Visível para todos os perfis; nada da simulação é salvo
export default function SimuladorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-neutral-900">Simulador</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-400">
          Uma conta rápida para o atendimento: quanto o cliente pode pagar de parcela, quanto financia e quais imóveis
          cadastrados cabem no bolso.
        </p>
      </div>
      <Simulator />
    </div>
  )
}
