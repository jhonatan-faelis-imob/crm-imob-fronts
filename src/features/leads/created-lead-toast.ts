import type { CadenceResult } from '@/types'

// POST /leads devolve `cadence` com as tarefas da etapa inicial; resposta antiga (sem cadence) mantém o texto de antes
export function createdLeadToastTitle(cadence: CadenceResult | undefined) {
  const count = cadence?.created.length ?? 0
  if (count === 0) return 'Lead criado com sucesso!'
  return `Lead criado. Criei ${count} ${count === 1 ? 'tarefa' : 'tarefas'} de acompanhamento.`
}
