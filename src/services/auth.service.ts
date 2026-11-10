import api from '@/lib/api'

export interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  creci: string | null
  avatarUrl: string | null
  role: string
  teamId: string | null
  teamName: string | null
  organizationName: string
  createdAt: string
}

export interface SessionTokens {
  accessToken: string
  refreshToken: string
}

export interface ProfileChange {
  name?: string
  /** Vazio limpa */
  phone?: string
  /** Vazio limpa */
  creci?: string
}

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
  getProfile: async (): Promise<Profile> => {
    const { data } = await api.get<Profile>('/auth/profile')
    return data
  },
  /** Devolve tokens novos: as outras sessões caem */
  updateProfile: async (change: ProfileChange): Promise<SessionTokens & { user: Profile }> => {
    const { data } = await api.patch<SessionTokens & { user: Profile }>('/auth/profile', change)
    return data
  },
  /** Devolve tokens novos: as outras sessões caem */
  changePassword: async (currentPassword: string, newPassword: string): Promise<SessionTokens> => {
    const { data } = await api.post<SessionTokens>('/auth/change-password', { currentPassword, newPassword })
    return data
  },
}
