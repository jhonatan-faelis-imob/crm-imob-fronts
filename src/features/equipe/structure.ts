import type { Role } from '@/types'
import { canCoordinate, canManageUser } from './permissions'
import type { Member, TeamWithMetrics } from './types'

// Regras puras da montagem da estrutura (equipes, coordenador, quem está sem equipe)

export function membersWithoutTeam(members: Member[]): Member[] {
  return members.filter((member) => member.active && !member.teamId)
}

/**
 * Quem pode ser escolhido como coordenador: ativo, coordenador ou superior, que quem age pode gerir
 * e que não coordena outra equipe (a própria equipe, exceptTeamId, não conta)
 */
export function availableCoordinators(
  members: Member[],
  teams: TeamWithMetrics[],
  actorRole: Role | undefined,
  exceptTeamId?: string,
): Member[] {
  const busy = new Set(
    teams.filter((team) => team.id !== exceptTeamId && team.coordinatorId).map((team) => team.coordinatorId),
  )
  return members.filter(
    (member) =>
      member.active && canCoordinate(member.role) && canManageUser(actorRole, member.role) && !busy.has(member.id),
  )
}

/** Gerente ou superior gerencia qualquer equipe; coordenador, só a própria */
export function canManageTeamMembers(actor: { role: Role; teamId: string | null } | null | undefined, teamId: string) {
  if (!actor) return false
  if (actor.role === 'coordenador') return actor.teamId === teamId
  return actor.role === 'gerente' || actor.role === 'diretor'
}

/**
 * Quem pode receber a carteira de `fromId`: ativo, outra pessoa, que quem age pode gerir
 * (coordenador só enxerga a própria equipe)
 */
export function transferCandidates(
  members: Member[],
  actor: { role: Role; teamId: string | null } | null | undefined,
  fromId: string,
): Member[] {
  if (!actor) return []
  return members.filter(
    (member) =>
      member.active &&
      member.id !== fromId &&
      canManageUser(actor.role, member.role) &&
      (actor.role !== 'coordenador' || (!!actor.teamId && member.teamId === actor.teamId)),
  )
}
