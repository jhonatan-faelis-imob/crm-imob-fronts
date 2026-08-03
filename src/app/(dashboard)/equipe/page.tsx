'use client'

import { Network, Plus } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { mapApiTeamToTeam, mapApiUserToMember, type ApiTeam, type ApiUser } from '@/features/equipe/api'
import { HierarchySheet } from '@/features/equipe/hierarchy-sheet'
import { MembersSection } from '@/features/equipe/members-section'
import { NewMemberDialog, type NewMemberFormValues } from '@/features/equipe/new-member-dialog'
import { NewTeamDialog, type NewTeamFormValues } from '@/features/equipe/new-team-dialog'
import { OverviewCards } from '@/features/equipe/overview-cards'
import { TeamsSection } from '@/features/equipe/teams-section'
import { defaultMemberFilters, type MemberFilters } from '@/features/equipe/types'
import { teamsService } from '@/services/teams.service'
import { usersService } from '@/services/users.service'
import { useAuthStore } from '@/store/auth.store'

export default function EquipePage() {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [memberFilters, setMemberFilters] = useState<MemberFilters>(defaultMemberFilters)
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false)
  const [isNewTeamOpen, setIsNewTeamOpen] = useState(false)
  const [isHierarchyOpen, setIsHierarchyOpen] = useState(false)

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

  function invalidateTeam() {
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['teams'] })
  }

  const createMember = useMutation({
    mutationFn: (dto: Record<string, unknown>) => usersService.create(dto),
    onSuccess: () => {
      invalidateTeam()
      toast.add({ title: 'Membro criado com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível criar o membro', type: 'error' })
    },
  })

  const createTeam = useMutation({
    mutationFn: async ({ dto, memberIds }: { dto: Record<string, unknown>; memberIds: string[] }) => {
      const team = await teamsService.create(dto)
      await Promise.all(memberIds.map((id) => usersService.update(id, { teamId: team.id })))
      return team
    },
    onSuccess: () => {
      invalidateTeam()
      toast.add({ title: 'Equipe criada com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível criar a equipe', type: 'error' })
    },
  })

  function handleCreateMember(data: NewMemberFormValues) {
    createMember.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
      creci: data.creci || undefined,
      role: data.role,
      teamId: data.teamId || undefined,
    })
  }

  function handleCreateTeam(data: NewTeamFormValues) {
    createTeam.mutate({
      dto: { name: data.name, coordinatorId: data.coordinatorId },
      memberIds: data.memberIds,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
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
          <button
            type="button"
            onClick={() => setIsNewTeamOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-brand hover:text-brand"
          >
            <Plus className="h-4 w-4" />
            Nova equipe
          </button>
          <button
            type="button"
            onClick={() => setIsNewMemberOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Novo membro
          </button>
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
          <TeamsSection teams={teams} members={members} />
          <MembersSection members={members} teams={teams} filters={memberFilters} onFiltersChange={setMemberFilters} />
        </>
      )}

      <NewMemberDialog
        open={isNewMemberOpen}
        onOpenChange={setIsNewMemberOpen}
        teams={teams}
        onCreate={handleCreateMember}
      />

      <NewTeamDialog open={isNewTeamOpen} onOpenChange={setIsNewTeamOpen} members={members} onCreate={handleCreateTeam} />

      <HierarchySheet open={isHierarchyOpen} onOpenChange={setIsHierarchyOpen} members={members} />
    </div>
  )
}
