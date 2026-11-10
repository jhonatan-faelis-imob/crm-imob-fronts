import type { Role } from '@/types'
import { ROLES } from './constants'

// Cópia da regra do backend (crm-imob-api/src/modules/users/user-permissions.ts). Mudou lá, muda aqui e no teste

const MANAGEABLE: Record<Role, readonly Role[]> = {
  diretor: ROLES,
  gerente: ['gerente', 'coordenador', 'corretor', 'administrativo'],
  coordenador: ['corretor', 'administrativo'],
  corretor: [],
  administrativo: [],
}

export const TEAM_COORDINATOR_ROLES: readonly Role[] = ['coordenador', 'gerente', 'diretor']

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value)
}

/** Quem tem o cargo actorRole pode criar ou editar alguém com o cargo targetRole? */
export function canManageUser(actorRole: string | undefined, targetRole: string): boolean {
  if (!actorRole || !isRole(actorRole) || !isRole(targetRole)) return false
  return MANAGEABLE[actorRole].includes(targetRole)
}

/** Cargos que aparecem no "Novo membro", na ordem da hierarquia */
export function manageableRoles(actorRole: string | undefined): Role[] {
  return ROLES.filter((role) => canManageUser(actorRole, role))
}

export function canCoordinate(role: string): boolean {
  return (TEAM_COORDINATOR_ROLES as readonly string[]).includes(role)
}

const LEVEL: Record<Role, number> = { diretor: 5, gerente: 4, coordenador: 3, corretor: 2, administrativo: 1 }

/** Mesma regra do @Roles do backend: o cargo é igual ou superior ao mínimo */
export function hasRoleAtLeast(role: string | undefined, minimum: Role): boolean {
  return !!role && isRole(role) && LEVEL[role] >= LEVEL[minimum]
}
