import api from '@/lib/api'

export const teamsService = {
  findAll: async () => {
    const { data } = await api.get('/teams')
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/teams', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/teams/${id}`, dto)
    return data
  },
}
