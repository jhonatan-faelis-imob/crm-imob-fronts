import api from '@/lib/api'

export const propertiesService = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await api.get('/properties', { params })
    return data
  },
  findById: async (id: string) => {
    const { data } = await api.get(`/properties/${id}`)
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/properties', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/properties/${id}`, dto)
    return data
  },
  findByIncome: async (income: number) => {
    const { data } = await api.get(`/properties/income-match/${income}`)
    return data
  },
  deactivate: async (id: string) => {
    const { data } = await api.delete(`/properties/${id}`)
    return data
  },
  linkLead: async (propertyId: string, leadId: string, notes?: string) => {
    const { data } = await api.post(`/properties/${propertyId}/leads/${leadId}`, { notes })
    return data
  },
  unlinkLead: async (propertyId: string, leadId: string) => {
    const { data } = await api.delete(`/properties/${propertyId}/leads/${leadId}`)
    return data
  },
}
