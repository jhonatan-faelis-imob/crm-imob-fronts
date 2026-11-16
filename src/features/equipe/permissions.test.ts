import { describe, expect, it } from 'vitest'
import type { Role } from '@/types'
import { ROLES } from './constants'
import { canCoordinate, canManageUser, hasRoleAtLeast, manageableRoles, memberActions, NO_MEMBER_ACTIONS } from './permissions'

const expected: Record<Role, Role[]> = {
  diretor: ['diretor', 'gerente', 'coordenador', 'corretor', 'administrativo'],
  gerente: ['gerente', 'coordenador', 'corretor', 'administrativo'],
  coordenador: ['corretor', 'administrativo'],
  corretor: [],
  administrativo: [],
}

describe('canManageUser (igual ao backend)', () => {
  for (const actor of ROLES) {
    for (const target of ROLES) {
      const allowed = expected[actor].includes(target)
      it(`${actor} ${allowed ? 'pode' : 'não pode'} gerir ${target}`, () => {
        expect(canManageUser(actor, target)).toBe(allowed)
      })
    }
  }

  it('sem usuário ou cargo desconhecido não pode', () => {
    expect(canManageUser(undefined, 'corretor')).toBe(false)
    expect(canManageUser('dono', 'corretor')).toBe(false)
  })

  it('manageableRoles segue a ordem da hierarquia', () => {
    expect(manageableRoles('gerente')).toEqual(expected.gerente)
    expect(manageableRoles('corretor')).toEqual([])
  })

  it('só coordenador ou superior coordena', () => {
    expect(ROLES.filter(canCoordinate)).toEqual(['diretor', 'gerente', 'coordenador'])
  })

  it('hasRoleAtLeast', () => {
    expect(hasRoleAtLeast('gerente', 'gerente')).toBe(true)
    expect(hasRoleAtLeast('coordenador', 'gerente')).toBe(false)
    expect(hasRoleAtLeast(undefined, 'corretor')).toBe(false)
  })
})

describe('memberActions', () => {
  const member = (role: Role, extra: Partial<{ id: string; teamId: string | null; active: boolean }> = {}) => ({
    id: 'alvo', role, teamId: 't1', active: true, ...extra,
  })
  const actor = (role: Role, teamId: string | null = 't1', id = 'eu') => ({ id, role, teamId })

  it('ninguém altera o próprio cargo nem se desativa ou exclui', () => {
    const actions = memberActions(actor('diretor', null, 'alvo'), member('diretor'))
    expect(actions).toMatchObject({ edit: true, editRole: false, deactivate: false, remove: false, transfer: false })
  })

  it('corretor só edita o próprio perfil', () => {
    expect(memberActions(actor('corretor'), member('corretor'))).toEqual(NO_MEMBER_ACTIONS)
    expect(memberActions(actor('corretor', 't1', 'alvo'), member('corretor')).edit).toBe(true)
  })

  it('coordenador age só na própria equipe e não troca e-mail nem redefine senha', () => {
    const inside = memberActions(actor('coordenador'), member('corretor'))
    expect(inside).toMatchObject({ edit: true, transfer: true, deactivate: true, editEmail: false, resetPassword: false, remove: false })
    expect(memberActions(actor('coordenador'), member('corretor', { teamId: 't2' })).deactivate).toBe(false)
    expect(memberActions(actor('coordenador'), member('gerente')).edit).toBe(false)
  })

  it('gerente não age sobre diretor; diretor exclui', () => {
    expect(memberActions(actor('gerente'), member('diretor')).deactivate).toBe(false)
    expect(memberActions(actor('gerente'), member('corretor'))).toMatchObject({ editEmail: true, resetPassword: true, remove: false })
    expect(memberActions(actor('diretor'), member('gerente')).remove).toBe(true)
  })

  it('inativo: reativar em vez de desativar', () => {
    const actions = memberActions(actor('gerente'), member('corretor', { active: false }))
    expect(actions).toMatchObject({ activate: true, deactivate: false, resetPassword: false })
  })
})
