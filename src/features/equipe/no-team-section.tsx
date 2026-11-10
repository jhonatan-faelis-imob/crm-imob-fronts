'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getInitials } from '@/lib/utils'
import type { Role } from '@/types'
import { ROLE_META } from './constants'
import { inputClassName, labelClassName } from './field'
import { canManageUser } from './permissions'
import type { Member, TeamWithMetrics } from './types'
import { useTeamActions } from './use-team-actions'

function PickTeamDialog({
  member,
  teams,
  onClose,
}: {
  member: Member | null
  teams: TeamWithMetrics[]
  onClose: () => void
}) {
  const { updateMembers } = useTeamActions()
  const [teamId, setTeamId] = useState('')

  function close() {
    setTeamId('')
    onClose()
  }

  function save() {
    if (!member || !teamId) return
    const teamName = teams.find((team) => team.id === teamId)?.name ?? 'a equipe'
    updateMembers.mutate(
      { teamId, change: { addUserIds: [member.id] }, successTitle: `${member.name} agora está em ${teamName}` },
      { onSuccess: close },
    )
  }

  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex w-[calc(100%-2rem)] max-w-sm flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Definir equipe</DialogTitle>
          <DialogDescription>{member?.name}</DialogDescription>
        </DialogHeader>
        <div className="p-4 sm:p-6">
          <label htmlFor="pick-team" className={labelClassName}>
            Equipe
          </label>
          <select
            id="pick-team"
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            className={inputClassName}
          >
            <option value="">Escolha a equipe</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
          <button
            type="button"
            onClick={close}
            className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!teamId || updateMembers.isPending}
            onClick={save}
            className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            Salvar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Quem está sem equipe (gerente ou superior), com atalho para colocar numa equipe */
export function NoTeamSection({
  members,
  teams,
  actorRole,
  onCreateTeam,
}: {
  members: Member[]
  teams: TeamWithMetrics[]
  actorRole: Role | undefined
  onCreateTeam: () => void
}) {
  const [picking, setPicking] = useState<Member | null>(null)
  if (members.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[20px] font-semibold text-neutral-900">Sem equipe</h2>
        <p className="text-sm text-neutral-400">
          {members.length === 1 ? '1 pessoa ainda não está' : `${members.length} pessoas ainda não estão`} em nenhuma
          equipe.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((member) => {
          const roleMeta = ROLE_META[member.role]
          const canMove = canManageUser(actorRole, member.role)
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-3"
            >
              <Avatar>
                <AvatarFallback className="bg-brand-bg text-brand">{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{member.name}</p>
                <span
                  className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: roleMeta.bg, color: roleMeta.text }}
                >
                  {roleMeta.label}
                </span>
              </div>
              {canMove && (
                <button
                  type="button"
                  onClick={() => (teams.length === 0 ? onCreateTeam() : setPicking(member))}
                  className="min-h-11 shrink-0 rounded-[8px] border-[0.5px] border-neutral-200 px-3 text-xs font-medium text-neutral-900 transition-colors hover:border-brand hover:text-brand"
                >
                  {teams.length === 0 ? 'Criar equipe' : 'Definir equipe'}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <PickTeamDialog member={picking} teams={teams} onClose={() => setPicking(null)} />
    </section>
  )
}
