import { describe, expect, it } from 'vitest'
import { leadMatchesSearch, phoneSearchDigits } from './lead-search'

const maria = { name: 'Maria da Silva', email: 'maria@exemplo.com', phone: '(19) 99546-1826', phone2: null }

describe('leadMatchesSearch (mesma regra do backend)', () => {
  it.each(['19995461826', '99546-1826', '995461826', '9954', '+55 19 99546-1826'])('acha o telefone buscando "%s"', (text) => {
    expect(leadMatchesSearch(maria, text)).toBe(true)
  })

  it('nome e e-mail continuam valendo', () => {
    expect(leadMatchesSearch(maria, 'MARIA')).toBe(true)
    expect(leadMatchesSearch(maria, '@exemplo')).toBe(true)
    expect(leadMatchesSearch(maria, 'joão')).toBe(false)
  })

  it('menos de 4 dígitos ou texto com letras não busca por telefone', () => {
    expect(phoneSearchDigits('995')).toBeNull()
    expect(leadMatchesSearch(maria, '995')).toBe(false)
    expect(phoneSearchDigits('Maria 1999')).toBeNull()
  })

  it('telefone salvo só com dígitos e phone2 também entram', () => {
    expect(leadMatchesSearch({ name: 'João', phone: '19988887777', phone2: '+55 (11) 3456-7890' }, '(19) 98888-7777')).toBe(true)
    expect(leadMatchesSearch({ name: 'João', phone: '19988887777', phone2: '+55 (11) 3456-7890' }, '3456-7890')).toBe(true)
  })
})
