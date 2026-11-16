import { isAxiosError } from 'axios'
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
  deactivatedAt?: string | null
  deactivatedByName?: string | null
  deactivationReason?: string | null
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
    deactivatedAt: apiUser.deactivatedAt ?? undefined,
    deactivatedByName: apiUser.deactivatedByName ?? undefined,
    deactivationReason: apiUser.deactivationReason ?? undefined,
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

/** Resposta do POST /users: a senha gerada vem uma única vez */
export interface CreatedUser extends ApiUser {
  temporaryPassword?: string
}

/** Mensagem do backend (409 de coordenador, 403 de cargo) ou a padrão */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message: unknown = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  }
  return fallback
}

export type MemberErrorField = 'email' | 'password' | 'role' | 'teamId' | 'phone' | 'name' | 'root'

/** Em qual campo do "Novo membro" mostrar a mensagem do backend */
export function memberErrorField(message: string): MemberErrorField {
  const text = message.toLowerCase()
  if (text.includes('email') || text.includes('e-mail')) return 'email'
  if (text.includes('senha') || text.includes('password')) return 'password'
  if (text.includes('cargo') || text.includes('role')) return 'role'
  if (text.includes('equipe') || text.includes('team')) return 'teamId'
  if (text.includes('telefone') || text.includes('phone')) return 'phone'
  if (text.includes('nome') || text.includes('name')) return 'name'
  return 'root'
}

/** 409 de exclusão: o que impede (leads, tarefas...) vem em `blockers` */
export interface DeleteBlocker {
  kind: string
  label: string
  count: number
}

export function deleteBlockers(error: unknown): DeleteBlocker[] {
  if (!isAxiosError(error) || error.response?.status !== 409) return []
  const blockers: unknown = error.response.data?.blockers
  if (!Array.isArray(blockers)) return []
  return blockers.filter(
    (item): item is DeleteBlocker =>
      typeof item === 'object' && item !== null && typeof item.label === 'string' && typeof item.count === 'number',
  )
}

/** 402 SEAT_LIMIT: plano cheio ao reativar */
export function isSeatLimitError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 402 && error.response.data?.code === 'SEAT_LIMIT'
}

/** Campos do modal de edição a que uma mensagem do backend se refere */
export type EditErrorField = 'email' | 'role' | 'teamId' | 'phone' | 'name' | 'root'

export function editErrorField(message: string): EditErrorField {
  const field = memberErrorField(message)
  return field === 'password' ? 'root' : field
}
