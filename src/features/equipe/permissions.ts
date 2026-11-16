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

export interface MemberActor {
  id: string
  role: Role
  teamId: string | null
}

export interface MemberActions {
  edit: boolean
  /** Cargo só muda por outra pessoa: nunca no próprio cadastro */
  editRole: boolean
  editEmail: boolean
  transfer: boolean
  resetPassword: boolean
  deactivate: boolean
  activate: boolean
  remove: boolean
}

export const NO_MEMBER_ACTIONS: MemberActions = {
  edit: false, editRole: false, editEmail: false, transfer: false,
  resetPassword: false, deactivate: false, activate: false, remove: false,
}

/**
 * O que quem está logado pode fazer com um membro (espelha o backend; ele é quem decide de verdade).
 * Coordenador só age sobre a própria equipe
 */
export function memberActions(
  actor: MemberActor | null | undefined,
  member: { id: string; role: Role; teamId: string | null; active: boolean },
): MemberActions {
  if (!actor) return NO_MEMBER_ACTIONS
  const isSelf = actor.id === member.id
  const manages = canManageUser(actor.role, member.role)
  const inScope = actor.role !== 'coordenador' || (!!actor.teamId && member.teamId === actor.teamId)
  const canAct = manages && inScope
  const isManagerOrAbove = hasRoleAtLeast(actor.role, 'gerente')
  return {
    edit: isSelf || canAct,
    editRole: !isSelf && canAct,
    // O próprio e-mail muda pelo perfil, nunca por aqui (editar a si mesmo derrubaria a própria sessão)
    editEmail: isManagerOrAbove && !isSelf && canAct,
    transfer: hasRoleAtLeast(actor.role, 'coordenador') && canAct && !isSelf,
    resetPassword: isManagerOrAbove && canAct && !isSelf && member.active,
    deactivate: canAct && !isSelf && member.active,
    activate: canAct && !member.active,
    remove: actor.role === 'diretor' && !isSelf,
  }
}

export function hasAnyMemberAction(actions: MemberActions): boolean {
  return Object.values(actions).some(Boolean)
}
