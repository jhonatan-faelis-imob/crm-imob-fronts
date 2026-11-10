import { describe, expect, it } from 'vitest'
import type { Role } from '@/types'
import { ROLES } from './constants'
import { canCoordinate, canManageUser, hasRoleAtLeast, manageableRoles } from './permissions'

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
