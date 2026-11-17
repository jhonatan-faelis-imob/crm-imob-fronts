'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { stageError } from './api'
import { plural, type ApiStage } from './constants'
import { useFunnelMutations } from './use-funnel-actions'

/** Exclusão de etapa vazia. Se a contagem estava velha e o servidor diz que há leads, passa para "Mover leads" */
export function DeleteStageDialog({
  stage,
  onClose,
  onHasLeads,
}: {
  /** Montado com key={stage.id}: o erro nasce limpo */
  stage: ApiStage | null
  onClose: () => void
  onHasLeads: (stage: ApiStage, count: number) => void
}) {
  const { remove } = useFunnelMutations()
  const [error, setError] = useState<string | null>(null)

  function confirm() {
    if (!stage) return
    setError(null)
    remove.mutate(stage.id, {
      onSuccess: onClose,
      onError: (caught) => {
        const info = stageError(caught, 'Não foi possível excluir a etapa.')
        if (info.code === 'STAGE_HAS_LEADS') {
          onClose()
          onHasLeads(stage, info.count ?? 0)
          return
        }
        setError(info.message)
      },
    })
  }

  const steps = stage?.cadenceStepsCount ?? 0

  return (
    <AlertDialog open={stage !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <AlertDialogHeader className="p-4 sm:p-6">
          <AlertDialogTitle>Excluir a etapa {stage?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {steps > 0 &&
              `Os ${plural(steps, 'passo de cadência', 'passos de cadência')} dela também ${steps === 1 ? 'será removido' : 'serão removidos'}. `}
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          {error && (
            <p role="alert" className="mt-2 rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:flex-row sm:justify-end sm:p-6">
          <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={remove.isPending}
            className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
          >
            {remove.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
