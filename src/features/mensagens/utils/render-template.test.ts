import { describe, expect, it } from 'vitest'
import { GREETING_FIXTURES, RENDER_FIXTURES } from './render-fixtures'
import { greeting, renderTemplateLocal, renderWithValues } from './render-template'

describe('renderWithValues (fixtures compartilhadas com o backend)', () => {
  it.each(RENDER_FIXTURES)('$name', ({ content, values, expected }) => {
    expect(renderWithValues(content, values)).toEqual(expected)
  })
})

describe('saudação no fuso de São Paulo', () => {
  it.each(GREETING_FIXTURES)('$saoPaulo → $expected', ({ utc, expected }) => {
    expect(greeting(new Date(utc))).toBe(expected)
  })
})

describe('renderTemplateLocal', () => {
  const base = { brokerName: 'João Lima', brokerPhone: '(19) 99999-0000', agencyName: 'Imob Exemplo', now: new Date('2026-11-10T13:00:00Z') }

  it('{{nome}} e {{primeiro_nome}} com nome composto', () => {
    const result = renderTemplateLocal('{{saudacao}}, {{primeiro_nome}}! ({{nome}})', { ...base, leadName: '  Maria   da Silva ' })
    expect(result).toEqual({ text: 'Bom dia, Maria! (  Maria   da Silva )', missing: [] })
  })

  it('{{primeiro_nome}} com nome de uma palavra só', () => {
    expect(renderTemplateLocal('Oi {{primeiro_nome}}', { ...base, leadName: 'Joaquim' }).text).toBe('Oi Joaquim')
  })

  it('variável sem valor fica como {{empreendimento}} e entra em missing', () => {
    const result = renderTemplateLocal('Sobre o {{empreendimento}}, fale com {{corretor}} ({{telefone_corretor}}) da {{imobiliaria}}', {
      ...base,
      leadName: 'Ana',
      propertyTitle: null,
    })
    expect(result).toEqual({
      text: 'Sobre o {{empreendimento}}, fale com João Lima ((19) 99999-0000) da Imob Exemplo',
      missing: ['empreendimento'],
    })
  })

  it('variável desconhecida permanece intacta', () => {
    const result = renderTemplateLocal('Oi {{apelido}} {{constructor}}', { ...base, leadName: 'Ana' })
    expect(result.text).toBe('Oi {{apelido}} {{constructor}}')
    expect(result.missing).toEqual(['apelido', 'constructor'])
  })

  it('{{documentos_pendentes}} fica no texto (só o servidor preenche)', () => {
    expect(renderTemplateLocal('Faltam:\n{{documentos_pendentes}}', { ...base, leadName: 'Ana' }).missing).toEqual(['documentos_pendentes'])
  })
})
