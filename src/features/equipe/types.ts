import type { Role, Team, User } from '@/types'

export interface MemberMetrics {
  leadsCount: number
  salesCount: number
  vgv: number
  goalTarget: number
}

export interface Member extends User {
  metrics: MemberMetrics
}

export interface TeamMetrics {
  vgvTarget: number
  vgvRealized: number
}

export interface TeamWithMetrics extends Team {
  description?: string
  metrics: TeamMetrics
}

export type RoleFilter = Role | 'todos'
export type StatusFilter = 'ativos' | 'inativos' | 'todos'

export interface MemberFilters {
  search: string
  teamId: string
  role: RoleFilter
  status: StatusFilter
}

export const defaultMemberFilters: MemberFilters = {
  search: '',
  teamId: 'todas',
  role: 'todos',
  status: 'ativos',
}
