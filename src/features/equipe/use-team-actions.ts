'use client'

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import { teamsService, type TeamMembersChange } from '@/services/teams.service'
import { apiErrorMessage } from './api'

/** Depois de qualquer ação de estrutura: users, teams e o detalhe da equipe */
export function invalidateTeamStructure(queryClient: QueryClient, teamId?: string) {
  queryClient.invalidateQueries({ queryKey: ['users'] })
  queryClient.invalidateQueries({ queryKey: ['teams'] })
  queryClient.invalidateQueries({ queryKey: ['me'] })
  if (teamId) queryClient.invalidateQueries({ queryKey: ['team', teamId] })
  else queryClient.invalidateQueries({ queryKey: ['team'] })
}

/** Definir/trocar/remover coordenador e mover membros, com toast da mensagem do backend (409, 403) */
export function useTeamActions() {
  const queryClient = useQueryClient()

  const setCoordinator = useMutation({
    mutationFn: ({ teamId, coordinatorId }: { teamId: string; coordinatorId: string | null }) =>
      teamsService.update(teamId, { coordinatorId }),
    onSuccess: (_data, { teamId, coordinatorId }) => {
      invalidateTeamStructure(queryClient, teamId)
      toast.add({ title: coordinatorId ? 'Coordenador definido' : 'Coordenador removido', type: 'success' })
    },
    onError: (error, { teamId }) => {
      invalidateTeamStructure(queryClient, teamId)
      toast.add({
        title: 'Não foi possível mudar o coordenador',
        description: apiErrorMessage(error, 'Tente de novo em instantes.'),
        type: 'error',
      })
    },
  })

  const updateMembers = useMutation({
    mutationFn: ({ teamId, change }: { teamId: string; change: TeamMembersChange; successTitle?: string }) =>
      teamsService.updateMembers(teamId, change),
    onSuccess: (_data, { teamId, change, successTitle }) => {
      invalidateTeamStructure(queryClient, teamId)
      const added = change.addUserIds?.length ?? 0
      const removed = change.removeUserIds?.length ?? 0
      const fallback = added > 0 ? `${added} ${added === 1 ? 'pessoa adicionada' : 'pessoas adicionadas'}` : 'Removido da equipe'
      toast.add({ title: successTitle ?? (removed > 0 && added === 0 ? 'Removido da equipe' : fallback), type: 'success' })
    },
    onError: (error, { teamId }) => {
      invalidateTeamStructure(queryClient, teamId)
      toast.add({
        title: 'Não foi possível atualizar os membros',
        description: apiErrorMessage(error, 'Tente de novo em instantes.'),
        type: 'error',
      })
    },
  })

  return { setCoordinator, updateMembers }
}
