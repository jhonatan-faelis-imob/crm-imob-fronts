'use client'

import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { Skeleton } from '@/components/ui/skeleton'
import { usersService, type TransferKind } from '@/services/users.service'
import { inputClassName, labelClassName } from './field'
import { transferCandidates } from './structure'
import { portfolioText, selectedKinds, TransferFields, transferableKinds } from './transfer-fields'
import type { MemberActor } from './permissions'
import type { Member } from './types'
import { useMemberActions } from './use-member-actions'

/** Desativar em duas etapas: o que a pessoa tem hoje e, se houver carteira, para quem passar */
export function DeactivateMemberDialog({
  member,
  members,
  actor,
  onClose,
}: {
  /** Montado com key={member.id}: o estado nasce limpo a cada pessoa */
  member: Member | null
  members: Member[]
  actor: MemberActor | null
  onClose: () => void
}) {
  const { deactivate } = useMemberActions()
  const [reason, setReason] = useState('')
  const [toUserId, setToUserId] = useState('')
  const [skipped, setSkipped] = useState<TransferKind[]>([])

  const portfolio = useQuery({
    queryKey: ['users', 'portfolio', member?.id],
    queryFn: () => usersService.portfolio(member?.id ?? ''),
    enabled: member !== null,
    staleTime: 0,
  })
  const summary = portfolio.data
  const hasPortfolio = !!summary && transferableKinds(summary).length > 0
  const kinds = summary ? selectedKinds(summary, skipped) : []
  const transferring = !!toUserId && kinds.length > 0
  const candidates = member ? transferCandidates(members, actor, member.id) : []

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!member) return
    const receiver = candidates.find((candidate) => candidate.id === toUserId)
    deactivate.mutate(
      {
        id: member.id,
        name: member.name,
        reason: reason.trim() || undefined,
        transfer: transferring && receiver ? { toUserId: receiver.id, toName: receiver.name, what: kinds } : undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <AlertDialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-h-[90vh] w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0 sm:max-w-md">
        <form onSubmit={submit}>
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Desativar {member?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              A pessoa perde o acesso na hora, mesmo com o sistema aberto.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-900">
              {portfolio.isLoading && <Skeleton className="h-5 w-3/4" />}
              {portfolio.isError && <span>Não consegui verificar a carteira. Você ainda pode desativar.</span>}
              {summary && (
                <>
                  <p className="text-xs font-medium text-neutral-400">Hoje essa pessoa tem</p>
                  <p className="mt-0.5 font-medium">{portfolioText(summary)}</p>
                  {summary.metasAtivas > 0 && (
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {summary.metasAtivas} {summary.metasAtivas === 1 ? 'meta ativa' : 'metas ativas'} (ficam no nome dela)
                    </p>
                  )}
                </>
              )}
            </div>

            {summary && hasPortfolio && (
              <TransferFields
                idPrefix="deactivate"
                summary={summary}
                candidates={candidates}
                toUserId={toUserId}
                onToUserId={setToUserId}
                skipped={skipped}
                onSkippedChange={setSkipped}
                placeholder="Não transferir agora"
              />
            )}

            <div>
              <label htmlFor="deactivate-reason" className={labelClassName}>
                Motivo (opcional)
              </label>
              <textarea
                id="deactivate-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={300}
                rows={2}
                className={`${inputClassName} resize-none text-base`}
              />
            </div>

            <p className="text-xs text-neutral-400">
              O histórico de vendas e metas continua no nome dela. O assento volta a ficar livre no plano.
            </p>
          </div>

          <AlertDialogFooter className="mx-0 mb-0 gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              disabled={deactivate.isPending}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              {deactivate.isPending ? 'Desativando...' : transferring ? 'Transferir e desativar' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
