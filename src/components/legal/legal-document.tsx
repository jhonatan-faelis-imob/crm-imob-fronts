import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { parseMarkdown, splitTitle, tableOfContents } from '@/lib/markdown'
import type { LegalDocument as LegalDocumentData } from '@/content/types'
import { MarkdownView } from './markdown-view'
import { PreliminaryNotice } from './preliminary-notice'

/** Contato de privacidade: só aparece quando NEXT_PUBLIC_PRIVACY_EMAIL está definido */
const PRIVACY_EMAIL = process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim()

function Toc({ entries }: { entries: { id: string; text: string }[] }) {
  if (entries.length === 0) return null
  const list = (
    <ol className="space-y-1 text-[14px]">
      {entries.map((entry) => (
        <li key={entry.id}>
          <a href={`#${entry.id}`} className="block rounded-[8px] px-2 py-1.5 text-muted-foreground hover:bg-canvas hover:text-brand">
            {entry.text}
          </a>
        </li>
      ))}
    </ol>
  )
  return (
    <>
      {/* Celular: lista recolhível, sem JavaScript */}
      <details className="group rounded-[16px] border-[0.5px] border-line bg-paper lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 text-[15px] font-semibold text-brand [&::-webkit-details-marker]:hidden">
          Nesta página
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <nav aria-label="Índice" className="border-t-[0.5px] border-line p-2">{list}</nav>
      </details>
      {/* Desktop: fixo na lateral */}
      <nav aria-label="Índice" className="sticky top-6 hidden max-h-[calc(100dvh-3rem)] self-start overflow-y-auto lg:block">
        <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">Nesta página</p>
        {list}
      </nav>
    </>
  )
}

/** Cabeçalho, índice, cartão com o texto e rodapé das páginas legais (Server Component) */
export function LegalDocument({ doc, current }: { doc: LegalDocumentData; current: 'privacidade' | 'termos' }) {
  const { title: markdownTitle, body } = splitTitle(parseMarkdown(doc.markdown))
  const entries = tableOfContents(body)

  return (
    <>
      <header className="border-b-[0.5px] border-line bg-paper">
        <div className="mx-auto flex h-14 max-w-[1040px] items-center justify-between gap-4 px-4">
          <Link href="/" className="text-[17px] font-semibold text-brand">
            Smart <span className="text-brand">CRM</span>
          </Link>
          <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-brand">
            Voltar ao sistema
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1040px] px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,720px)] lg:gap-10">
          <Toc entries={entries} />

          <main className="min-w-0 space-y-4 lg:col-start-2 lg:row-start-1">
            <PreliminaryNotice updatedAt={doc.updatedAt} />
            <article className="rounded-[16px] border-[0.5px] border-line bg-paper p-5 sm:p-10">
              <h1 className="text-[28px] font-semibold leading-tight text-brand sm:text-[32px]">
                {markdownTitle ?? doc.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Última atualização: {doc.updatedAt}</p>
              <div className="mt-8">
                <MarkdownView blocks={body} />
              </div>
            </article>
          </main>
        </div>
      </div>

      <footer className="border-t-[0.5px] border-line bg-paper">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-3 px-4 py-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Documentos legais" className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/termos" aria-current={current === 'termos' ? 'page' : undefined} className="min-h-6 hover:text-brand aria-[current=page]:font-medium aria-[current=page]:text-brand">
              Termos de Uso
            </Link>
            <Link href="/privacidade" aria-current={current === 'privacidade' ? 'page' : undefined} className="min-h-6 hover:text-brand aria-[current=page]:font-medium aria-[current=page]:text-brand">
              Política de Privacidade
            </Link>
          </nav>
          {PRIVACY_EMAIL && (
            <p>
              Contato de privacidade:{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="font-medium text-muted-foreground hover:text-brand">
                {PRIVACY_EMAIL}
              </a>
            </p>
          )}
        </div>
      </footer>
    </>
  )
}
