import type { Role } from '@/types'
import type { Member, TeamWithMetrics } from './types'

export interface ApiUser {
  id: string
  name: string
  email: string
  role: Role
  phone?: string | null
  creci?: string | null
  avatarUrl?: string | null
  teamId: string | null
  active: boolean
  createdAt: string
}

export interface ApiTeam {
  id: string
  organizationId: string
  name: string
  coordinatorId: string | null
  active: boolean
  createdAt: string
}

export function mapApiUserToMember(apiUser: ApiUser, organizationId: string): Member {
  return {
    id: apiUser.id,
    organizationId,
    teamId: apiUser.teamId,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone ?? undefined,
    role: apiUser.role,
    avatarUrl: apiUser.avatarUrl ?? undefined,
    creci: apiUser.creci ?? undefined,
    active: apiUser.active,
    createdAt: apiUser.createdAt,
    metrics: { leadsCount: 0, salesCount: 0, vgv: 0, goalTarget: 0 },
  }
}

export function mapApiTeamToTeam(apiTeam: ApiTeam): TeamWithMetrics {
  return {
    id: apiTeam.id,
    organizationId: apiTeam.organizationId,
    name: apiTeam.name,
    coordinatorId: apiTeam.coordinatorId,
    active: apiTeam.active,
    createdAt: apiTeam.createdAt,
    metrics: { vgvTarget: 0, vgvRealized: 0 },
  }
}
