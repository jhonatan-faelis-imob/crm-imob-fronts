import { describe, expect, it } from 'vitest'
import { formatDay, formatDocument, isValidDocumentOrEmpty } from './constants'

describe('CPF e CNPJ no front', () => {
  it.each(['', '529.982.247-25', '11.222.333/0001-81'])('"%s" vale', (value) => {
    expect(isValidDocumentOrEmpty(value)).toBe(true)
  })
  it.each(['529.982.247-24', '111.111.111-11', '11.222.333/0001-80', '123'])('"%s" não vale', (value) => {
    expect(isValidDocumentOrEmpty(value)).toBe(false)
  })
  it('formata com máscara', () => {
    expect(formatDocument('52998224725')).toBe('529.982.247-25')
    expect(formatDocument('11222333000181')).toBe('11.222.333/0001-81')
  })
})

describe('formatDay', () => {
  it('mostra o dia gravado, sem voltar um dia no fuso do Brasil', () => {
    expect(formatDay('2026-12-11T00:00:00.000Z')).toBe('11/12/2026')
  })
})
