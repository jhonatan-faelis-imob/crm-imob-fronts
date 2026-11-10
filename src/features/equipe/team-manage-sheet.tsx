'use client'

import { useQuery } from '@tanstack/react-query'
import { Crown, Plus, UserMinus } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials } from '@/lib/utils'
import { teamsService } from '@/services/teams.service'
import type { Role } from '@/types'
import { ROLE_META } from './constants'
import { inputClassName, labelClassName } from './field'
import { canManageUser, hasRoleAtLeast } from './permissions'
import { availableCoordinators, membersWithoutTeam } from './structure'
import type { Member, TeamWithMetrics } from './types'
import { useTeamActions } from './use-team-actions'

interface TeamDetail {
  id: string
  name: string
  coordinatorId: string | null
  coordinator: { id: string; name: string; role: Role } | null
  members: { id: string; name: string; role: Role; active: boolean }[]
}

function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_META[role]
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      {meta.label}
    </span>
  )
}

function CoordinatorBlock({
  team,
  candidates,
  canChange,
}: {
  team: TeamDetail
  candidates: Member[]
  canChange: boolean
}) {
  const { setCoordinator } = useTeamActions()
  const [choice, setChoice] = useState('')
  const options = candidates.filter((member) => member.id !== team.coordinatorId)
  const label = team.coordinator ? 'Trocar coordenador' : 'Definir coordenador'

  return (
    <section className="space-y-3 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF3E0] text-warning">
          <Crown className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-neutral-400">Coordenador</p>
          <p className="truncate text-sm font-medium text-neutral-900">{team.coordinator?.name ?? 'Sem coordenador'}</p>
        </div>
        {canChange && team.coordinator && (
          <button
            type="button"
            disabled={setCoordinator.isPending}
            onClick={() => setCoordinator.mutate({ teamId: team.id, coordinatorId: null })}
            className="shrink-0 rounded-[8px] px-2 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-60"
          >
            Remover
          </button>
        )}
      </div>

      {canChange && (
        <div>
          <label htmlFor="team-coordinator" className={labelClassName}>
            {label}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id="team-coordinator"
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
              className={inputClassName}
            >
              <option value="">Escolha quem vai coordenar</option>
              {options.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {ROLE_META[member.role].label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!choice || setCoordinator.isPending}
              onClick={() =>
                setCoordinator.mutate({ teamId: team.id, coordinatorId: choice }, { onSuccess: () => setChoice('') })
              }
              className="shrink-0 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              {label}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">
            {options.length === 0
              ? 'Ninguém disponível: crie um membro com cargo coordenador ou superior.'
              : 'Quem coordena passa a fazer parte da equipe. Cada pessoa coordena uma equipe só.'}
          </p>
        </div>
      )}
    </section>
  )
}

function AddMembers({ teamId, candidates }: { teamId: string; candidates: Member[] }) {
  const { updateMembers } = useTeamActions()
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <section className="space-y-2">
      <p className={labelClassName}>Adicionar quem está sem equipe</p>
      {candidates.length === 0 ? (
        <p className="text-xs text-neutral-400">Ninguém sem equipe no momento.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 rounded-[12px] border-[1.5px] border-neutral-200 bg-white p-2">
            {candidates.map((member) => {
              const isSelected = selected.includes(member.id)
              return (
                <button
                  key={member.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(member.id)}
                  className={`min-h-9 rounded-full border-[0.5px] px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'border-brand bg-brand-bg text-brand'
                      : 'border-neutral-200 text-neutral-600 hover:border-brand hover:text-brand'
                  }`}
                >
                  {isSelected ? '✓' : '+'} {member.name} · {ROLE_META[member.role].label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            disabled={selected.length === 0 || updateMembers.isPending}
            onClick={() =>
              updateMembers.mutate({ teamId, change: { addUserIds: selected } }, { onSuccess: () => setSelected([]) })
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Adicionar{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
        </>
      )}
    </section>
  )
}

function TeamManageBody({
  teamId,
  members,
  teams,
  actorRole,
}: {
  teamId: string
  members: Member[]
  teams: TeamWithMetrics[]
  actorRole: Role | undefined
}) {
  const { updateMembers } = useTeamActions()
  const { data: team, isLoading } = useQuery<TeamDetail>({
    queryKey: ['team', teamId],
    queryFn: () => teamsService.findById(teamId),
  })

  if (isLoading || !team) {
    return (
      <div className="space-y-3 p-4 sm:p-6">
        <Skeleton className="h-28 rounded-[16px]" />
        <Skeleton className="h-40 rounded-[16px]" />
      </div>
    )
  }

  const canChangeCoordinator = hasRoleAtLeast(actorRole, 'gerente')
  const addable = membersWithoutTeam(members).filter((member) => canManageUser(actorRole, member.role))

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
      <CoordinatorBlock
        team={team}
        candidates={availableCoordinators(members, teams, actorRole, team.id)}
        canChange={canChangeCoordinator}
      />

      <section className="space-y-2">
        <p className={labelClassName}>Na equipe ({team.members.length})</p>
        {team.members.length === 0 ? (
          <p className="rounded-[12px] bg-neutral-100 p-4 text-center text-sm text-neutral-400">
            Ninguém nesta equipe ainda.
          </p>
        ) : (
          <ul className="divide-y-[0.5px] divide-neutral-200 rounded-[16px] border-[0.5px] border-neutral-200 bg-white">
            {team.members.map((member) => {
              const isCoordinator = member.id === team.coordinatorId
              const canRemove = !isCoordinator && canManageUser(actorRole, member.role)
              return (
                <li key={member.id} className="flex items-center gap-2.5 px-3 py-2.5">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-brand-bg text-xs text-brand">{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${member.active ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {member.name}
                    </p>
                    {isCoordinator && <p className="text-[11px] text-warning">Coordenador da equipe</p>}
                  </div>
                  <RoleBadge role={member.role} />
                  {canRemove ? (
                    <button
                      type="button"
                      aria-label={`Remover ${member.name} da equipe`}
                      disabled={updateMembers.isPending}
                      onClick={() => updateMembers.mutate({ teamId: team.id, change: { removeUserIds: [member.id] } })}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-neutral-400 hover:bg-[#FFEBEE] hover:text-danger disabled:opacity-60"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="h-9 w-9 shrink-0" />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <AddMembers teamId={team.id} candidates={addable} />
    </div>
  )
}

/** Painel de detalhe da equipe: coordenador e membros */
export function TeamManageSheet({
  team,
  onOpenChange,
  members,
  teams,
  actorRole,
}: {
  /** null = fechado */
  team: TeamWithMetrics | null
  onOpenChange: (open: boolean) => void
  members: Member[]
  teams: TeamWithMetrics[]
  actorRole: Role | undefined
}) {
  return (
    <Sheet open={team !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-[#F7F5F3] p-0 sm:max-w-md">
        <SheetHeader className="border-b-[0.5px] border-neutral-200 bg-white p-4 pr-12 sm:p-6 sm:pr-14">
          <SheetTitle>{team?.name ?? 'Equipe'}</SheetTitle>
          <SheetDescription>Gerenciar coordenador e membros.</SheetDescription>
        </SheetHeader>
        {team && (
          <TeamManageBody key={team.id} teamId={team.id} members={members} teams={teams} actorRole={actorRole} />
        )}
      </SheetContent>
    </Sheet>
  )
}
