'use client'

import { useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { inputClassName, labelClassName } from '@/features/equipe/field'
import { stageError } from './api'
import { leadsText, type ApiStage } from './constants'
import { moveSummary, useFunnelMutations } from './use-funnel-actions'

export type MoveIntent = 'move' | 'delete'

function MoveForm({
  stage,
  stages,
  intent,
  count,
  onClose,
}: {
  stage: ApiStage
  stages: ApiStage[]
  intent: MoveIntent
  /** Quantos leads a etapa tem (a contagem do servidor, se ela estava desatualizada) */
  count: number
  onClose: () => void
}) {
  const { moveLeads, remove } = useFunnelMutations()
  const [toId, setToId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const targets = stages.filter((item) => item.id !== stage.id)
  const target = targets.find((item) => item.id === toId)
  const pending = moveLeads.isPending || remove.isPending
  const deleting = intent === 'delete'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!target) return
    setError(null)
    let moved
    try {
      moved = await moveLeads.mutateAsync({ fromId: stage.id, toId: target.id })
    } catch (caught) {
      setError(stageError(caught, 'Não foi possível mover os leads.').message)
      return
    }
    if (!deleting) {
      toast.add({ title: `Leads movidos para ${target.name}`, description: moveSummary(moved), type: 'success' })
      onClose()
      return
    }
    try {
      const removed = await remove.mutateAsync(stage.id)
      toast.add({
        title: 'Leads movidos e etapa excluída',
        description:
          removed.removedCadenceSteps > 0
            ? `${moveSummary(moved)} · ${removed.removedCadenceSteps} passo(s) de cadência removido(s)`
            : moveSummary(moved),
        type: 'success',
      })
      onClose()
    } catch (caught) {
      // Os leads já foram: mostra por que a exclusão não passou e deixa tentar de novo
      setError(`${moveSummary(moved)}. Mas a etapa não foi excluída: ${stageError(caught, 'tente de novo.').message}`)
    }
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <div>
          <label htmlFor="move-leads-to" className={labelClassName}>
            Mover para
          </label>
          <select
            id="move-leads-to"
            value={toId}
            onChange={(event) => setToId(event.target.value)}
            className={`${inputClassName} text-base`}
          >
            <option value="">Escolha a etapa de destino</option>
            {targets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <p className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-600">
          Os {leadsText(count)} vão receber as tarefas automáticas da etapa de destino, se houver.
        </p>

        {error && (
          <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!target || pending}
          className={`min-h-11 rounded-[8px] px-4 text-sm font-medium text-white disabled:opacity-60 ${
            deleting ? 'bg-danger hover:opacity-90' : 'bg-brand hover:bg-brand-dark'
          }`}
        >
          {pending ? 'Processando...' : deleting ? 'Mover e excluir' : 'Mover leads'}
        </button>
      </DialogFooter>
    </form>
  )
}

/** "Mover leads" avulso e o passo anterior à exclusão de uma etapa que ainda tem leads */
export function MoveLeadsDialog({
  stage,
  stages,
  intent,
  count,
  session,
  onClose,
}: {
  stage: ApiStage | null
  stages: ApiStage[]
  intent: MoveIntent
  count: number
  /** Muda a cada abertura: o seletor e o erro nascem limpos */
  session: number
  onClose: () => void
}) {
  return (
    <Dialog open={stage !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>{intent === 'delete' ? `Excluir ${stage?.name ?? 'etapa'}` : `Mover leads de ${stage?.name ?? 'etapa'}`}</DialogTitle>
          <DialogDescription>
            {intent === 'delete'
              ? `Esta etapa tem ${leadsText(count)}. Escolha para onde movê-los antes de excluir.`
              : `Todos os ${leadsText(count)} ativos desta etapa vão para a etapa escolhida.`}
          </DialogDescription>
        </DialogHeader>
        {stage && <MoveForm key={session} stage={stage} stages={stages} intent={intent} count={count} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
