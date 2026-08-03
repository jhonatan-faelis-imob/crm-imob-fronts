import api from '@/lib/api'

export const funnelStagesService = {
  findAll: async () => {
    const { data } = await api.get('/funnel-stages')
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/funnel-stages', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/funnel-stages/${id}`, dto)
    return data
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/funnel-stages/${id}`)
    return data
  },
  reorder: async (orders: { id: string; orderIndex: number }[]) => {
    const { data } = await api.patch('/funnel-stages/reorder', { orders })
    return data
  },
}
