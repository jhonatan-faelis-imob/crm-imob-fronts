import api from '@/lib/api'

export const interactionsService = {
  findByLead: async (leadId: string) => {
    const { data } = await api.get(`/interactions/lead/${leadId}`)
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/interactions', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/interactions/${id}`, dto)
    return data
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/interactions/${id}`)
    return data
  },
}
