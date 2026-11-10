import { describe, expect, it } from 'vitest'
import { isValidProfilePhone, passwordStrength } from './rules'

describe('telefone do perfil', () => {
  it.each([
    ['', true],
    ['(11) 98765-4321', true],
    ['(11) 3333-4444', true],
    ['(11) 9876', false],
    ['1198765432100', false],
  ])('"%s" → %s', (value, valid) => {
    expect(isValidProfilePhone(value)).toBe(valid)
  })
})

describe('força da senha', () => {
  it('vazia não mostra nada', () => expect(passwordStrength('').score).toBe(0))
  it('curta é fraca', () => expect(passwordStrength('Ab1!').label).toBe('Fraca'))
  it('só letras minúsculas é fraca', () => expect(passwordStrength('abcdefghij').label).toBe('Fraca'))
  it('letras e números é média', () => expect(passwordStrength('abcdef12').label).toBe('Média'))
  it('longa e variada é forte', () => expect(passwordStrength('Casa-Azul-2026').label).toBe('Forte'))
})
