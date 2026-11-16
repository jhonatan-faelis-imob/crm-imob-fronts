import api from '@/lib/api'

/** O que a pessoa tem hoje; o aviso antes de desativar */
export interface PortfolioSummary {
  leadsAtivos: number
  tarefasPendentes: number
  imoveis: number
  metasAtivas: number
}

export type TransferKind = 'leads' | 'tasks' | 'properties'

export interface TransferResult {
  leads: number
  tasks: number
  properties: number
}

export const usersService = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await api.get('/users', { params })
    return data
  },
  findById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/users', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/users/${id}`, dto)
    return data
  },
  resetPassword: async (id: string, password: string): Promise<{ ok: true }> => {
    const { data } = await api.patch(`/users/${id}/reset-password`, { password })
    return data
  },
  portfolio: async (id: string): Promise<PortfolioSummary> => {
    const { data } = await api.get(`/users/${id}/portfolio`)
    return data
  },
  deactivate: async (id: string, reason?: string) => {
    const { data } = await api.patch(`/users/${id}/deactivate`, { reason: reason || undefined })
    return data
  },
  activate: async (id: string) => {
    const { data } = await api.patch(`/users/${id}/activate`)
    return data
  },
  transfer: async (id: string, dto: { toUserId: string; what: TransferKind[] }): Promise<TransferResult> => {
    const { data } = await api.post(`/users/${id}/transfer`, dto)
    return data
  },
  remove: async (id: string): Promise<{ ok: true }> => {
    const { data } = await api.delete(`/users/${id}`)
    return data
  },
}
