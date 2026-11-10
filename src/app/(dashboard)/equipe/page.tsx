'use client'

import { Network, Plus } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import {
  apiErrorMessage,
  mapApiTeamToTeam,
  mapApiUserToMember,
  type ApiTeam,
  type ApiUser,
  type CreatedUser,
} from '@/features/equipe/api'
import { ROLES } from '@/features/equipe/constants'
import { HierarchySheet } from '@/features/equipe/hierarchy-sheet'
import { MembersSection } from '@/features/equipe/members-section'
import { NewMemberDialog, type NewMemberFormValues } from '@/features/equipe/new-member-dialog'
import { NewTeamDialog, type NewTeamFormValues } from '@/features/equipe/new-team-dialog'
import { NoTeamSection } from '@/features/equipe/no-team-section'
import { OverviewCards } from '@/features/equipe/overview-cards'
import { hasRoleAtLeast, manageableRoles } from '@/features/equipe/permissions'
import { availableCoordinators, canManageTeamMembers, membersWithoutTeam } from '@/features/equipe/structure'
import { TeamManageSheet } from '@/features/equipe/team-manage-sheet'
import { TeamsSection } from '@/features/equipe/teams-section'
import { defaultMemberFilters, type MemberFilters, type TeamWithMetrics } from '@/features/equipe/types'
import { invalidateTeamStructure } from '@/features/equipe/use-team-actions'
import { useHydrated } from '@/lib/use-hydrated'
import { teamsService } from '@/services/teams.service'
import { usersService } from '@/services/users.service'
import { useAuthStore } from '@/store/auth.store'
import type { Role } from '@/types'

function asRole(value: string | undefined): Role | undefined {
  return ROLES.find((role) => role === value)
}

export default function EquipePage() {
  const user = useAuthStore((state) => state.user)
  const isHydrated = useHydrated()
  const queryClient = useQueryClient()
  const [memberFilters, setMemberFilters] = useState<MemberFilters>(defaultMemberFilters)
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false)
  const [isNewTeamOpen, setIsNewTeamOpen] = useState(false)
  const [isHierarchyOpen, setIsHierarchyOpen] = useState(false)
  const [managedTeamId, setManagedTeamId] = useState<string | null>(null)

  const { data: usersData, isLoading: loadingUsers } = useQuery<ApiUser[]>({
    queryKey: ['users'],
    queryFn: () => usersService.findAll(),
  })

  const { data: teamsData, isLoading: loadingTeams } = useQuery<ApiTeam[]>({
    queryKey: ['teams'],
    queryFn: () => teamsService.findAll(),
  })

  const isLoading = loadingUsers || loadingTeams
  const members = (usersData ?? []).map((apiUser) => mapApiUserToMember(apiUser, user?.organizationId ?? ''))
  const teams = (teamsData ?? []).map(mapApiTeamToTeam)

  // Permissões só depois da hidratação (o store vem do localStorage)
  const actorRole = isHydrated ? asRole(user?.role) : undefined
  // A equipe de quem age vem da lista (o store guarda a do login, que pode ter mudado)
  const actorTeamId = members.find((member) => member.id === user?.id)?.teamId ?? user?.teamId ?? null
  const actor = actorRole ? { role: actorRole, teamId: actorTeamId } : null
  const canCreateMember = manageableRoles(actorRole).length > 0
  const isManager = hasRoleAtLeast(actorRole, 'gerente')
  const isCoordinator = actorRole === 'coordenador'
  const memberTeams = isCoordinator ? teams.filter((team) => team.id === actorTeamId) : teams
  const withoutTeam = membersWithoutTeam(members)
  const managedTeam = teams.find((team) => team.id === managedTeamId) ?? null

  const createMember = useMutation({
    mutationFn: (dto: Record<string, unknown>): Promise<CreatedUser> => usersService.create(dto),
    onSuccess: (created) => {
      invalidateTeamStructure(queryClient, created.teamId ?? undefined)
      toast.add({ title: 'Membro criado com sucesso!', type: 'success' })
    },
    // Erro: o modal fica aberto e mostra a mensagem no campo certo
  })

  const createTeam = useMutation({
    mutationFn: async ({ dto, memberIds }: { dto: Record<string, unknown>; memberIds: string[] }) => {
      const team: ApiTeam = await teamsService.create(dto)
      // O coordenador já entra na equipe pelo backend
      const addUserIds = memberIds.filter((id) => id !== dto.coordinatorId)
      if (addUserIds.length > 0) await teamsService.updateMembers(team.id, { addUserIds })
      return team
    },
    onSuccess: () => toast.add({ title: 'Equipe criada com sucesso!', type: 'success' }),
    onError: (error) => {
      toast.add({
        title: 'Não foi possível criar a equipe',
        description: apiErrorMessage(error, 'Tente de novo em instantes.'),
        type: 'error',
      })
    },
    // Mesmo com erro nos membros a equipe pode ter sido criada
    onSettled: () => invalidateTeamStructure(queryClient),
  })

  function handleCreateMember(data: NewMemberFormValues) {
    return createMember.mutateAsync({
      name: data.name,
      email: data.email,
      password: data.passwordMode === 'manual' ? data.password : undefined,
      phone: data.phone || undefined,
      creci: data.creci || undefined,
      role: data.role,
      teamId: data.teamId || undefined,
    })
  }

  function handleCreateTeam(data: NewTeamFormValues) {
    return createTeam.mutateAsync({
      dto: { name: data.name, coordinatorId: data.coordinatorId || undefined },
      memberIds: data.memberIds,
    })
  }

  function manageTeam(team: TeamWithMetrics) {
    setManagedTeamId(team.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-400">Configurações</p>
          <h1 className="text-[28px] font-semibold text-neutral-900">Equipe</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {isLoading ? 'Carregando...' : `${members.length} membros · ${teams.length} equipes`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHierarchyOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-brand hover:text-brand"
          >
            <Network className="h-4 w-4" />
            Ver hierarquia
          </button>
          {isManager && (
            <button
              type="button"
              onClick={() => setIsNewTeamOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-brand hover:text-brand"
            >
              <Plus className="h-4 w-4" />
              Nova equipe
            </button>
          )}
          {canCreateMember && (
            <button
              type="button"
              onClick={() => setIsNewMemberOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              <Plus className="h-4 w-4" />
              Novo membro
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-[16px]" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-[16px]" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <OverviewCards members={members} teams={teams} />
          <TeamsSection
            teams={teams}
            members={members}
            canCreateTeam={isManager}
            canChangeCoordinator={isManager}
            canManageMembers={(teamId) => canManageTeamMembers(actor, teamId)}
            onCreateTeam={() => setIsNewTeamOpen(true)}
            onManageTeam={manageTeam}
          />
          {isManager && (
            <NoTeamSection
              members={withoutTeam}
              teams={teams}
              actorRole={actorRole}
              onCreateTeam={() => setIsNewTeamOpen(true)}
            />
          )}
          <MembersSection members={members} teams={teams} filters={memberFilters} onFiltersChange={setMemberFilters} />
        </>
      )}

      <NewMemberDialog
        open={isNewMemberOpen}
        onOpenChange={setIsNewMemberOpen}
        teams={memberTeams}
        actorRole={actorRole}
        requiredTeamId={isCoordinator ? actorTeamId : null}
        onCreate={handleCreateMember}
      />

      <NewTeamDialog
        open={isNewTeamOpen}
        onOpenChange={setIsNewTeamOpen}
        coordinators={availableCoordinators(members, teams, actorRole)}
        withoutTeam={withoutTeam}
        onCreate={handleCreateTeam}
      />

      <TeamManageSheet
        team={managedTeam}
        onOpenChange={(open) => !open && setManagedTeamId(null)}
        members={members}
        teams={teams}
        actorRole={actorRole}
      />

      <HierarchySheet open={isHierarchyOpen} onOpenChange={setIsHierarchyOpen} members={members} teams={teams} />
    </div>
  )
}
