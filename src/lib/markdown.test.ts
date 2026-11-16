import { describe, expect, it } from 'vitest'
import { isSafeHref, parseInline, parseMarkdown, splitTitle, tableOfContents } from './markdown'

const SAMPLE = `# Título

## 1. Dados coletados

Texto com **negrito** e [link](https://exemplo.com).

- um
- dois
  - filho

| A | B |
|---|---|
| x | y |

## 1. Dados coletados

1. primeiro
2. segundo
`

describe('parseMarkdown', () => {
  const blocks = parseMarkdown(SAMPLE)

  it('separa o título da página e monta o índice só com os ##, com ids únicos', () => {
    const { title, body } = splitTitle(blocks)
    expect(title).toBe('Título')
    expect(tableOfContents(body)).toEqual([
      { id: '1-dados-coletados', text: '1. Dados coletados' },
      { id: '1-dados-coletados-2', text: '1. Dados coletados' },
    ])
  })

  it('lê listas com filho, tabela e lista numerada', () => {
    expect(blocks).toContainEqual({
      type: 'list', ordered: false,
      items: [{ text: 'um', children: [] }, { text: 'dois', children: ['filho'] }],
    })
    expect(blocks).toContainEqual({ type: 'table', header: ['A', 'B'], rows: [['x', 'y']] })
    expect(blocks).toContainEqual({
      type: 'list', ordered: true, items: [{ text: 'primeiro', children: [] }, { text: 'segundo', children: [] }],
    })
  })
})

describe('parseInline', () => {
  it('negrito, itálico, código e link', () => {
    expect(parseInline('a **b** *c* `d` [e](/f)')).toEqual([
      { type: 'text', text: 'a ' }, { type: 'bold', text: 'b' }, { type: 'text', text: ' ' },
      { type: 'italic', text: 'c' }, { type: 'text', text: ' ' }, { type: 'code', text: 'd' },
      { type: 'text', text: ' ' }, { type: 'link', text: 'e', href: '/f' },
    ])
  })

  it('recusa link perigoso (javascript:) e deixa como texto', () => {
    expect(isSafeHref('javascript:alert(1)')).toBe(false)
    expect(isSafeHref('//evil.com')).toBe(false)
    expect(parseInline('[x](javascript:alert(1))').every((part) => part.type === 'text')).toBe(true)
  })
})
