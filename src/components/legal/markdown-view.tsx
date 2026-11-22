import Link from 'next/link'
import { parseInline, type Block } from '@/lib/markdown'

function Inlines({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, index) => {
        switch (part.type) {
          case 'bold':
            return <strong key={index} className="font-semibold text-brand">{part.text}</strong>
          case 'italic':
            return <em key={index}>{part.text}</em>
          case 'code':
            return <code key={index} className="rounded bg-canvas px-1 py-0.5 font-mono text-[13px]">{part.text}</code>
          case 'link': {
            const className = 'font-medium text-brand underline-offset-2 hover:underline'
            if (part.href.startsWith('/') || part.href.startsWith('#')) {
              return <Link key={index} href={part.href} className={className}>{part.text}</Link>
            }
            return <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className={className}>{part.text}</a>
          }
          default:
            return <span key={index}>{part.text}</span>
        }
      })}
    </>
  )
}

const HEADING_CLASS: Record<number, string> = {
  2: 'mt-12 scroll-mt-6 border-l-4 border-brand pl-3 text-[22px] font-semibold leading-snug text-brand first:mt-0',
  3: 'mt-8 scroll-mt-6 text-[18px] font-semibold leading-snug text-brand',
  4: 'mt-6 scroll-mt-6 text-[16px] font-semibold text-brand',
}

/** Renderiza os blocos do leitor de Markdown com os componentes do design system */
export function MarkdownView({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4 text-[15px] leading-7 text-muted-foreground">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            const level = Math.min(Math.max(block.level, 2), 4)
            const Tag = `h${level}` as 'h2' | 'h3' | 'h4'
            return <Tag key={index} id={block.id} className={HEADING_CLASS[level]}>{block.text}</Tag>
          }
          case 'paragraph':
            return <p key={index}><Inlines text={block.text} /></p>
          case 'list': {
            const Tag = block.ordered ? 'ol' : 'ul'
            return (
              <Tag key={index} className={`space-y-1.5 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-muted-foreground`}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="pl-1">
                    <Inlines text={item.text} />
                    {item.children.length > 0 && (
                      <ul className="mt-1.5 list-[circle] space-y-1 pl-5">
                        {item.children.map((child, childIndex) => (
                          <li key={childIndex}><Inlines text={child} /></li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </Tag>
            )
          }
          case 'table':
            return (
              <div key={index} className="overflow-x-auto rounded-[12px] border-[0.5px] border-line">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-canvas text-left text-xs text-muted-foreground">
                    <tr>
                      {block.header.map((cell, cellIndex) => (
                        <th key={cellIndex} className="px-4 py-3 font-medium"><Inlines text={cell} /></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t-[0.5px] border-line align-top">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3 text-brand"><Inlines text={cell} /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'quote':
            return (
              <blockquote key={index} className="rounded-[12px] bg-canvas px-4 py-3 text-muted-foreground">
                <Inlines text={block.text} />
              </blockquote>
            )
          default:
            return <hr key={index} className="border-line" />
        }
      })}
    </div>
  )
}
