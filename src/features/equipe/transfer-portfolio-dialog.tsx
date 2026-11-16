'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { usersService, type TransferKind } from '@/services/users.service'
import type { MemberActor } from './permissions'
import { transferCandidates } from './structure'
import { portfolioText, selectedKinds, TransferFields, transferableKinds } from './transfer-fields'
import type { Member } from './types'
import { useMemberActions } from './use-member-actions'

/** "Transferir carteira" avulso: leads ativos, tarefas pendentes e imóveis. Metas e vendas não mudam de dono */
export function TransferPortfolioDialog({
  member,
  members,
  actor,
  onClose,
}: {
  /** Montado com key={member.id} */
  member: Member | null
  members: Member[]
  actor: MemberActor | null
  onClose: () => void
}) {
  const { transfer } = useMemberActions()
  const [toUserId, setToUserId] = useState('')
  const [skipped, setSkipped] = useState<TransferKind[]>([])

  const portfolio = useQuery({
    queryKey: ['users', 'portfolio', member?.id],
    queryFn: () => usersService.portfolio(member?.id ?? ''),
    enabled: member !== null,
    staleTime: 0,
  })
  const summary = portfolio.data
  const empty = !!summary && transferableKinds(summary).length === 0
  const kinds = summary ? selectedKinds(summary, skipped) : []
  const candidates = member ? transferCandidates(members, actor, member.id) : []
  const receiver = candidates.find((candidate) => candidate.id === toUserId)

  function save() {
    if (!member || !receiver || kinds.length === 0) return
    transfer.mutate({ id: member.id, toUserId: receiver.id, toName: receiver.name, what: kinds }, { onSuccess: onClose })
  }

  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Transferir carteira</DialogTitle>
          <DialogDescription>{member?.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          {portfolio.isLoading && <Skeleton className="h-5 w-3/4" />}
          {portfolio.isError && <p className="text-sm text-danger">Não consegui carregar a carteira. Tente de novo.</p>}
          {summary && (
            <p className="rounded-[12px] bg-neutral-100 p-3 text-sm font-medium text-neutral-900">{portfolioText(summary)}</p>
          )}
          {empty && <p className="text-sm text-neutral-400">Não há nada para transferir.</p>}
          {summary && !empty && (
            <>
              <TransferFields
                idPrefix="transfer"
                summary={summary}
                candidates={candidates}
                toUserId={toUserId}
                onToUserId={setToUserId}
                skipped={skipped}
                onSkippedChange={setSkipped}
                placeholder="Escolha quem recebe"
              />
              <p className="text-xs text-neutral-400">
                Metas e vendas já registradas continuam no nome de {member?.name}.
              </p>
            </>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!receiver || kinds.length === 0 || transfer.isPending}
            onClick={save}
            className="min-h-11 rounded-[8px] bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {transfer.isPending ? 'Transferindo...' : 'Transferir'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
