import { describe, expect, it } from 'vitest'
import type { FunnelStage } from '@/types'
import { canManageFunnel, defaultPlacement, isHexColor, isTerminalStage, orderIndexFor } from './constants'

const stage = (id: string, name: string, orderIndex: number): FunnelStage => ({
  id, name, orderIndex, organizationId: 'o', color: '#000000', isDefault: false, createdAt: '',
})

describe('canManageFunnel', () => {
  it.each([
    ['diretor', true], ['gerente', true], ['coordenador', true], ['corretor', false], ['administrativo', false],
  ])('%s: %s', (role, expected) => expect(canManageFunnel({ role })).toBe(expected))
  it('sem usuário, não', () => expect(canManageFunnel(null)).toBe(false))
})

describe('cores e etapas de desfecho', () => {
  it('só aceita #RRGGBB', () => {
    expect(isHexColor('#6366f1')).toBe(true)
    expect(isHexColor('6366f1')).toBe(false)
    expect(isHexColor('#fff')).toBe(false)
  })
  it('reconhece Ganho e Perdido sem acento e maiúsculas', () => {
    expect(isTerminalStage({ name: ' GANHO ' })).toBe(true)
    expect(isTerminalStage({ name: 'Perdído' })).toBe(true)
    expect(isTerminalStage({ name: 'Fechado' })).toBe(false)
  })
})

describe('posição da etapa nova', () => {
  it('antes ocupa a posição da referência; depois, a seguinte', () => {
    expect(orderIndexFor(stage('a', 'A', 3), 'antes')).toBe(3)
    expect(orderIndexFor(stage('a', 'A', 3), 'depois')).toBe(4)
  })
  it('sugere antes de Ganho; sem Ganho, depois da última', () => {
    const list = [stage('n', 'Novo', 1), stage('g', 'Ganho', 2), stage('p', 'Perdido', 3)]
    expect(defaultPlacement(list)).toEqual({ stageId: 'g', placement: 'antes' })
    expect(defaultPlacement([stage('n', 'Novo', 1), stage('v', 'Visita', 2)])).toEqual({ stageId: 'v', placement: 'depois' })
    expect(defaultPlacement([])).toBeNull()
  })
})
