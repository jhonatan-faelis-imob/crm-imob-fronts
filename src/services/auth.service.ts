import api from '@/lib/api'

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
}
