import { FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LeadDocsSummary } from '@/types'
import { docsChipStyle } from '../constants'

// Kanban e lista: vem pronto no GET /leads (lead.docs), sem chamada extra
export function DocsChip({ docs, className }: { docs: LeadDocsSummary | null | undefined; className?: string }) {
  if (!docs || docs.requiredTotal === 0) return null
  const style = docsChipStyle(docs)
  return (
    <span
      title={`${docs.requiredApproved} de ${docs.requiredTotal} documentos obrigatórios aprovados`}
      className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', className)}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <FileCheck className="h-3 w-3" />
      Docs {docs.requiredApproved}/{docs.requiredTotal}
    </span>
  )
}
