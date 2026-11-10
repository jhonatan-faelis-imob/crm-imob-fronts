import { describe, expect, it } from 'vitest'
import type { Role } from '@/types'
import { availableCoordinators, canManageTeamMembers, membersWithoutTeam } from './structure'
import type { Member, TeamWithMetrics } from './types'

const member = (id: string, role: Role, teamId: string | null = null, active = true): Member => ({
  id,
  organizationId: 'org',
  teamId,
  name: id,
  email: `${id}@x.com`,
  role,
  active,
  createdAt: '',
  metrics: { leadsCount: 0, salesCount: 0, vgv: 0, goalTarget: 0 },
})
const team = (id: string, coordinatorId: string | null): TeamWithMetrics => ({
  id,
  organizationId: 'org',
  name: id,
  coordinatorId,
  active: true,
  createdAt: '',
  metrics: { vgvTarget: 0, vgvRealized: 0 },
})

describe('estrutura da equipe', () => {
  const members = [
    member('d1', 'diretor'),
    member('g1', 'gerente'),
    member('k1', 'coordenador', 't1'),
    member('k2', 'coordenador'),
    member('c1', 'corretor'),
    member('x1', 'coordenador', null, false),
  ]
  const teams = [team('t1', 'k1'), team('t2', null)]

  it('coordenador disponível: cargo certo, ativo, gerível e sem outra equipe', () => {
    expect(availableCoordinators(members, teams, 'diretor').map((m) => m.id)).toEqual(['d1', 'g1', 'k2'])
    expect(availableCoordinators(members, teams, 'gerente').map((m) => m.id)).toEqual(['g1', 'k2'])
  })

  it('na troca, o coordenador atual da própria equipe continua na lista', () => {
    expect(availableCoordinators(members, teams, 'gerente', 't1').map((m) => m.id)).toEqual(['g1', 'k1', 'k2'])
  })

  it('sem equipe lista só ativos', () => {
    expect(membersWithoutTeam(members).map((m) => m.id)).toEqual(['d1', 'g1', 'k2', 'c1'])
  })

  it('coordenador só gerencia a própria equipe', () => {
    expect(canManageTeamMembers({ role: 'coordenador', teamId: 't1' }, 't1')).toBe(true)
    expect(canManageTeamMembers({ role: 'coordenador', teamId: 't1' }, 't2')).toBe(false)
    expect(canManageTeamMembers({ role: 'gerente', teamId: null }, 't2')).toBe(true)
    expect(canManageTeamMembers({ role: 'corretor', teamId: 't1' }, 't1')).toBe(false)
  })
})
