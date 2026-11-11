import { describe, expect, it } from 'vitest'
import type { Plan } from '@/services/billing.service'
import { clampSeats, missingBillingInfo, planTotal, shortfallMessage } from './subscription-rules'

const corretor: Plan = { id: 'corretor', name: 'Corretor', price: 89.9, seats: 1, extraSeatPrice: null, maxSeats: 1 }
const equipe: Plan = { id: 'equipe', name: 'Equipe', price: 247, seats: 5, extraSeatPrice: 30, maxSeats: null }

describe('planTotal e clampSeats', () => {
  it('Equipe com 7 usuários dá R$ 307', () => expect(planTotal(equipe, 7)).toBe(307))
  it('Corretor é sempre 1 usuário e R$ 89,90', () => {
    expect(clampSeats(corretor, 3)).toBe(1)
    expect(planTotal(corretor, 3)).toBe(89.9)
  })
  it('abaixo dos incluídos sobe para os incluídos', () => expect(clampSeats(equipe, 2)).toBe(5))
})

describe('shortfallMessage', () => {
  it('explica quantos desativar', () => {
    expect(shortfallMessage(7, 5)).toBe('Você tem 7 usuários ativos. Desative 2 usuários antes ou escolha mais usuários.')
    expect(shortfallMessage(2, 1)).toContain('Desative 1 usuário antes')
    expect(shortfallMessage(5, 5)).toBeNull()
  })
})

describe('missingBillingInfo', () => {
  it('lista o que falta', () => {
    expect(missingBillingInfo(null)).toEqual(['nome ou razão social', 'CPF ou CNPJ', 'e-mail', 'telefone'])
    expect(
      missingBillingInfo({ billingName: 'X', billingDocument: '1', billingEmail: 'a@b.c', billingPhone: null }),
    ).toEqual(['telefone'])
  })
})
