import api from '@/lib/api'

export interface TeamMembersChange {
  addUserIds?: string[]
  removeUserIds?: string[]
}

export const teamsService = {
  findAll: async () => {
    const { data } = await api.get('/teams')
    return data
  },
  findById: async (id: string) => {
    const { data } = await api.get(`/teams/${id}`)
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/teams', dto)
    return data
  },
  /** coordinatorId: null remove o coordenador. Definir alguém também o coloca na equipe */
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/teams/${id}`, dto)
    return data
  },
  /** Adiciona e remove numa transação só */
  updateMembers: async (id: string, change: TeamMembersChange) => {
    const { data } = await api.patch(`/teams/${id}/members`, change)
    return data
  },
}
