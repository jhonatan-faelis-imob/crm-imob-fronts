import api from '@/lib/api'

export const reportsService = {
  getDashboard: async () => {
    const { data } = await api.get('/reports/dashboard')
    return data
  },
  getSalesByPeriod: async (startDate: string, endDate: string, groupBy = 'month') => {
    const { data } = await api.get('/reports/sales-by-period', { params: { startDate, endDate, groupBy } })
    return data
  },
  getBrokerRanking: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/broker-ranking', { params: { startDate, endDate } })
    return data
  },
  getSalesByProperty: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/sales-by-property', { params: { startDate, endDate } })
    return data
  },
  getLeadsBySource: async () => {
    const { data } = await api.get('/reports/leads-by-source')
    return data
  },
  getSalesByTeam: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/sales-by-team', { params: { startDate, endDate } })
    return data
  },
  getSalesByIncomeBracket: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/sales-by-income-bracket', { params: { startDate, endDate } })
    return data
  },
}
