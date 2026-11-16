'use client'

import { useState, type FormEvent } from 'react'
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
import { usersService } from '@/services/users.service'
import { apiErrorMessage, deleteBlockers, type DeleteBlocker } from './api'
import { labelClassName, inputClassName } from './field'
import type { Member } from './types'
import { invalidateMemberChanges } from './use-member-actions'

const CONFIRMATION_WORD = 'excluir'

/** Exclusão definitiva. Com vínculos o backend responde 409 e o diálogo mostra o que impede */
export function DeleteMemberDialog({
  member,
  onClose,
  onSuggestDeactivate,
}: {
  /** Montado com key={member.id}: confirmação e erro nascem limpos */
  member: Member | null
  onClose: () => void
  /** Chamado pelo botão "Desativar em vez de excluir" quando há vínculos */
  onSuggestDeactivate: (member: Member) => void
}) {
  const queryClient = useQueryClient()
  const [confirmation, setConfirmation] = useState('')
  const [blockers, setBlockers] = useState<DeleteBlocker[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const isConfirmed = confirmation.trim().toLowerCase() === CONFIRMATION_WORD

  const remove = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      toast.add({ title: `${member?.name ?? 'Usuário'} excluído`, type: 'success' })
      onClose()
    },
    onError: (error) => {
      setBlockers(deleteBlockers(error))
      setMessage(apiErrorMessage(error, 'Não foi possível excluir. Tente de novo em instantes.'))
    },
    onSettled: () => invalidateMemberChanges(queryClient),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (member && isConfirmed) remove.mutate(member.id)
  }

  const hasBlockers = blockers.length > 0

  return (
    <AlertDialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-h-[90vh] w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0 sm:max-w-md">
        <form onSubmit={submit}>
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Excluir {member?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e não pode ser desfeita. Só dá para excluir quem não tem leads, tarefas, imóveis,
              metas, vendas, interações nem links compartilhados. Na dúvida, desative.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
            {message && (
              <div role="alert" className="rounded-[12px] bg-[#FFEBEE] p-3 text-[13px] text-danger">
                <p className="font-medium">{message}</p>
                {hasBlockers && (
                  <ul className="mt-2 list-inside list-disc">
                    {blockers.map((blocker) => (
                      <li key={blocker.kind}>
                        {blocker.count} {blocker.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {hasBlockers && member?.active && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onSuggestDeactivate(member)
                }}
                className="min-h-11 w-full rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand"
              >
                Desativar em vez de excluir
              </button>
            )}

            {!hasBlockers && (
              <div>
                <label htmlFor="delete-member-confirmation" className={labelClassName}>
                  Para confirmar, digite {CONFIRMATION_WORD} abaixo
                </label>
                <input
                  id="delete-member-confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  className={`${inputClassName} text-base`}
                />
              </div>
            )}
          </div>

          <AlertDialogFooter className="mx-0 mb-0 gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              {hasBlockers ? 'Fechar' : 'Cancelar'}
            </AlertDialogCancel>
            {!hasBlockers && (
              <AlertDialogAction
                type="submit"
                disabled={!isConfirmed || remove.isPending}
                className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
              >
                {remove.isPending ? 'Excluindo...' : 'Excluir definitivamente'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
