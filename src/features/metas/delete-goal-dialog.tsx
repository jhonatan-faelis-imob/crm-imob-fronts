'use client'

import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { toast } from '@/components/ui/toast'
import { goalsService } from '@/services/goals.service'
import { goalScope, type ApiGoal } from './api'
import { formatPeriodLabel } from './calculations'
import { invalidateGoalQueries } from './invalidate-goal-queries'

const CONFIRMATION_WORD = 'meta'

export function DeleteGoalDialog({
  open,
  onOpenChange,
  goal,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: ApiGoal | null
  onDeleted: (goalId: string) => void
}) {
  const queryClient = useQueryClient()
  const [confirmation, setConfirmation] = useState('')
  const isConfirmed = confirmation.trim().toLowerCase() === CONFIRMATION_WORD

  function close() {
    onOpenChange(false)
    setConfirmation('')
  }

  const deleteGoal = useMutation({
    mutationFn: (goalId: string) => goalsService.remove(goalId),
    onSuccess: (_, goalId) => {
      // Sai do cache antes de invalidar: uma meta excluída responde 404
      queryClient.removeQueries({ queryKey: ['goal-summary', goalId] })
      queryClient.removeQueries({ queryKey: ['goal-entries', goalId] })
      queryClient.setQueryData<ApiGoal[]>(['goals'], (goals) => goals?.filter((item) => item.id !== goalId))
      invalidateGoalQueries(queryClient)
      toast.add({ title: 'Meta excluída', type: 'success' })
      onDeleted(goalId)
      close()
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 403) {
        toast.add({ title: 'Você não tem permissão para excluir esta meta', type: 'error' })
        close()
        return
      }
      toast.add({ title: 'Não foi possível excluir a meta', type: 'error' })
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (goal && isConfirmed) deleteGoal.mutate(goal.id)
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close()
      }}
    >
      <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <form onSubmit={onSubmit}>
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription>
              A meta {goal?.title} ({goal && formatPeriodLabel(goal)}) será excluída e deixará de aparecer nas metas e
              no ranking. As vendas e os leads não são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
            {goal && goalScope(goal) !== 'individual' && (
              <p className="rounded-[12px] bg-[#FFF3E0] p-3 text-[13px] font-medium text-warning">
                Esta meta é compartilhada e some para toda a equipe.
              </p>
            )}
            <div>
              <label htmlFor="delete-goal-confirmation" className="text-[13px] font-medium text-neutral-900">
                Para confirmar, digite meta abaixo
              </label>
              <input
                id="delete-goal-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                className="mt-1.5 w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand"
              />
            </div>
          </div>

          <AlertDialogFooter className="mx-0 mb-0 gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              disabled={!isConfirmed || deleteGoal.isPending}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              Excluir meta
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
