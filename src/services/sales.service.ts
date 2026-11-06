import api from '@/lib/api'

export interface CreateSaleDto {
  leadId: string
  propertyId?: string
  saleValue: number
  unitIdentifier?: string
  commissionPct?: number
  soldAt: string
  notes?: string
}

export interface PendingLead {
  id: string
  name: string
  interestValue: string | number | null
  funnelStageId: string | null
  owner: { id: string; name: string } | null
}

export const salesService = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await api.get('/sales', { params })
    return data
  },
  getSummary: async (startDate?: string, endDate?: string) => {
    const { data } = await api.get('/sales/summary', { params: { startDate, endDate } })
    return data
  },
  create: async (dto: CreateSaleDto) => {
    const { data } = await api.post('/sales', dto)
    return data
  },
  updateStatus: async (id: string, status: string, reason?: string) => {
    const { data } = await api.patch(`/sales/${id}/status`, { status, reason })
    return data
  },
  getPendingLeads: async (): Promise<PendingLead[]> => {
    const { data } = await api.get('/sales/pending-leads')
    return data
  },
}
