import { slugify } from '@/lib/slugify'

// Leitor de Markdown mínimo, sem dependência, para as páginas legais (src/content/*.ts).
// Cobre: títulos (#), parágrafos, listas (uma camada de aninhamento), tabelas, citações e linha (---).
// No texto: **negrito**, *itálico*, `código` e [texto](link). O resto vira texto comum (nada é HTML).

export interface ListItem {
  text: string
  children: string[]
}

export type Block =
  | { type: 'heading'; level: number; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: ListItem[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'quote'; text: string }
  | { type: 'rule' }

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string }

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/
const BULLET = /^(\s*)([-*+])\s+(.*)$/
const NUMBERED = /^(\s*)\d+[.)]\s+(.*)$/
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableStart(lines: string[], index: number): boolean {
  return lines[index].includes('|') && index + 1 < lines.length && TABLE_SEPARATOR.test(lines[index + 1]) && lines[index + 1].includes('-')
}

function startsBlock(lines: string[], index: number): boolean {
  const line = lines[index]
  return (
    HEADING.test(line) ||
    BULLET.test(line) ||
    NUMBERED.test(line) ||
    /^>\s?/.test(line) ||
    /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    isTableStart(lines, index)
  )
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  const usedIds = new Map<string, number>()

  function uniqueId(text: string): string {
    const base = slugify(text) || 'secao'
    const count = usedIds.get(base) ?? 0
    usedIds.set(base, count + 1)
    return count === 0 ? base : `${base}-${count + 1}`
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      i++
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2], id: uniqueId(heading[2]) })
      i++
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: 'rule' })
      i++
      continue
    }

    if (isTableStart(lines, i)) {
      const header = splitRow(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].trim() !== '' && lines[i].includes('|')) {
        rows.push(splitRow(lines[i]))
        i++
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', text: quote.join(' ').trim() })
      continue
    }

    const bullet = BULLET.exec(line)
    const numbered = NUMBERED.exec(line)
    if (bullet || numbered) {
      const ordered = !bullet
      const items: ListItem[] = []
      while (i < lines.length) {
        const current = lines[i]
        const b = BULLET.exec(current)
        const n = NUMBERED.exec(current)
        const match = ordered ? n : b
        if (match) {
          const indent = match[1].length
          const text = ordered ? match[2] : match[3]
          if (indent >= 2 && items.length > 0) items[items.length - 1].children.push(text.trim())
          else items.push({ text: text.trim(), children: [] })
          i++
        } else if ((ordered ? b : n) && /^\s{2,}/.test(current) && items.length > 0) {
          // sublista de outro tipo dentro do item
          const sub = ordered ? b : n
          items[items.length - 1].children.push((ordered ? sub?.[3] : sub?.[2])?.trim() ?? '')
          i++
        } else if (/^\s{2,}\S/.test(current) && items.length > 0 && !startsBlock(lines, i)) {
          // continuação do texto do item
          items[items.length - 1].text += ` ${current.trim()}`
          i++
        } else {
          break
        }
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const paragraph: string[] = [line.trim()]
    i++
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines, i)) {
      paragraph.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
  }
  return blocks
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g

/** Só links http(s), mailto, tel, âncoras e caminhos do próprio site */
export function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href)
}

export function parseInline(text: string): Inline[] {
  const parts: Inline[] = []
  for (const piece of text.split(INLINE)) {
    if (!piece) continue
    if (piece.startsWith('**') && piece.endsWith('**') && piece.length > 4) parts.push({ type: 'bold', text: piece.slice(2, -2) })
    else if (piece.startsWith('`') && piece.endsWith('`') && piece.length > 2) parts.push({ type: 'code', text: piece.slice(1, -1) })
    else if (piece.startsWith('*') && piece.endsWith('*') && piece.length > 2) parts.push({ type: 'italic', text: piece.slice(1, -1) })
    else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(piece)
      if (link && isSafeHref(link[2])) parts.push({ type: 'link', text: link[1], href: link[2] })
      else parts.push({ type: 'text', text: piece })
    }
  }
  return parts
}

export interface TocEntry {
  id: string
  text: string
}

/** Índice: títulos de nível 2 (o `#` único é o título da página) */
export function tableOfContents(blocks: Block[]): TocEntry[] {
  return blocks.flatMap((block) => (block.type === 'heading' && block.level === 2 ? [{ id: block.id, text: block.text }] : []))
}

/** Se o texto abre com um `#` (título da página), separa-o do corpo */
export function splitTitle(blocks: Block[]): { title: string | null; body: Block[] } {
  const first = blocks[0]
  if (first && first.type === 'heading' && first.level === 1) return { title: first.text, body: blocks.slice(1) }
  return { title: null, body: blocks }
}
