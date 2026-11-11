import { describe, expect, it } from 'vitest'
import { slugify, SLUG_PATTERN } from '@/lib/slugify'
import { moneyInput, parseMoney, suggestedPrice } from './rules'

const plans = [
  { id: 'corretor', name: 'Corretor', price: 89.9, seats: 1, extraSeatPrice: null },
  { id: 'equipe', name: 'Equipe', price: 247, seats: 5, extraSeatPrice: 30 },
]

describe('suggestedPrice', () => {
  it('base e assentos extras', () => {
    expect(suggestedPrice(plans, 'equipe', 5)).toBe(247)
    expect(suggestedPrice(plans, 'equipe', 7)).toBe(307)
    expect(suggestedPrice(plans, 'corretor', 3)).toBe(89.9)
    expect(suggestedPrice(plans, 'pro', 3)).toBeNull()
  })
})

describe('parseMoney', () => {
  it.each([
    ['247', 247],
    ['247,50', 247.5],
    ['1.247,50', 1247.5],
    ['R$ 89,90', 89.9],
    ['247.5', 247.5],
    ['', null],
    ['abc', null],
  ])('"%s" → %s', (value, expected) => {
    expect(parseMoney(value)).toBe(expected)
  })
  it('moneyInput volta para o formato do campo', () => expect(moneyInput(89.9)).toBe('89,90'))
})

describe('slugify', () => {
  it('tira acentos, espaços e hífens sobrando', () => {
    expect(slugify('  Imobiliária São João -- Centro ')).toBe('imobiliaria-sao-joao-centro')
    expect(SLUG_PATTERN.test(slugify('Casa & Cia.'))).toBe(true)
  })
})
