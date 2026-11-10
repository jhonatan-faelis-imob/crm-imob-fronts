'use client'

import { FileCheck, ListChecks, Plus, RefreshCw, Send, X } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  MessagePreviewDialog,
  type MessageDraft,
  type WhatsAppLead,
} from '@/features/mensagens/components/message-preview-dialog'
import { ProgressBar } from '@/features/metas/progress-bar'
import { useMessageContext } from '@/features/mensagens/use-message-context'
import { prepareMessage } from '@/features/mensagens/utils/send-message'
import type { ChecklistItem, ChecklistStatus, DocumentHolder } from '@/types'
import { ASK_DOCUMENTS_MESSAGE } from '../constants'
import { useLeadChecklist } from '../use-lead-checklist'
import { ChecklistItemDialog, type ChecklistItemFormData } from './checklist-item-dialog'
import { ChecklistRow } from './checklist-row'

const secondaryButtonClassName =
  'inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border-[0.5px] border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10'

const BULK_ACTIONS: { status: ChecklistStatus; label: string }[] = [
  { status: 'recebido', label: 'Recebido' },
  { status: 'aprovado', label: 'Aprovado' },
  { status: 'dispensado', label: 'Dispensar' },
]

// Titular e Cônjuge vêm da lista padrão; avulsos ficam em Outros
function groupItems(items: ChecklistItem[]) {
  const byHolder = (holder: DocumentHolder) =>
    items.filter((item) => item.requirementId !== null && item.holder === holder)
  return [
    { key: 'titular', title: 'Titular', items: byHolder('titular') },
    { key: 'conjuge', title: 'Cônjuge', items: byHolder('conjuge') },
    { key: 'outros', title: 'Outros', items: items.filter((item) => item.requirementId === null) },
  ].filter((group) => group.items.length > 0)
}

export function DocumentsTab({ lead }: { lead: WhatsAppLead }) {
  const { query, updateItem, bulkUpdate, addItem, removeItem, sync } = useLeadChecklist(lead.id, true)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<{ item: ChecklistItem | null; session: number } | null>(null)
  const [deleting, setDeleting] = useState<ChecklistItem | null>(null)
  const [draft, setDraft] = useState<{ draft: MessageDraft; session: number } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Montada no navegador; o modal busca só {{documentos_pendentes}} no servidor
  const messageContext = useMessageContext(lead)
  async function askDocuments() {
    const context = await messageContext.load()
    setDraft((current) => ({
      draft: { templateId: null, templateName: 'Pedir documentos pendentes', text: prepareMessage(ASK_DOCUMENTS_MESSAGE, context).text, context },
      session: (current?.session ?? 0) + 1,
    }))
    setIsPreviewOpen(true)
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelection() {
    setIsSelecting(false)
    setSelected(new Set())
  }

  function submitDialog(data: ChecklistItemFormData) {
    if (dialog?.item) {
      updateItem.mutate({ id: dialog.item.id, change: { name: data.name } })
    } else {
      addItem.mutate({
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        holder: data.holder,
        required: data.required,
      })
    }
    setDialog(null)
  }

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-[16px]" />
        <Skeleton className="h-64 rounded-[16px]" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <p className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-6 text-center text-sm text-danger">
        Não foi possível carregar o checklist.
      </p>
    )
  }

  const { items, summary } = query.data
  const groups = groupItems(items)
  const hasPending = summary.pendingRequired > 0
  const pendingCount = summary.counts.pendente + summary.counts.recusado

  const askButton = (
    <button
      type="button"
      onClick={() => void askDocuments()}
      disabled={!hasPending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#25D366] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
    >
      <Send className="h-4 w-4" />
      Pedir documentos pendentes
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-neutral-900">
            {summary.requiredTotal > 0
              ? `${summary.requiredApproved} de ${summary.requiredTotal} obrigatórios aprovados`
              : 'Nenhum documento obrigatório'}
          </p>
          {summary.percent !== null && <span className="text-sm font-semibold text-brand">{summary.percent}%</span>}
        </div>
        <ProgressBar value={summary.percent ?? 0} className="mt-2" />
        <p className="mt-2 text-xs text-neutral-400">
          {summary.counts.aprovado} aprovados · {summary.counts.recebido} recebidos · {pendingCount} pendentes
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {hasPending ? (
            askButton
          ) : (
            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex" />}>{askButton}</TooltipTrigger>
              <TooltipContent>Nenhum documento pendente</TooltipContent>
            </Tooltip>
          )}
          <button type="button" onClick={() => setDialog({ item: null, session: Date.now() })} className={secondaryButtonClassName}>
            <Plus className="h-4 w-4" />
            Adicionar documento
          </button>
          {items.length > 0 && !isSelecting && (
            <button type="button" onClick={() => setIsSelecting(true)} className={secondaryButtonClassName}>
              <ListChecks className="h-4 w-4" />
              Marcar vários
            </button>
          )}
        </div>
        {!hasPending && <p className="mt-2 text-xs text-neutral-400 sm:hidden">Nenhum documento pendente.</p>}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="h-6 w-6" />}
          title="Nenhum documento no checklist"
          description="A lista da imobiliária não tem documentos que se apliquem a este cliente. Adicione um documento avulso ou sincronize depois de ajustar a lista."
        />
      ) : (
        groups.map((group) => (
          <section key={group.key} className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white px-3 py-2 sm:px-4">
            <h3 className="px-1 pt-2 text-xs font-medium uppercase tracking-wide text-neutral-400">{group.title}</h3>
            <ul className="divide-y-[0.5px] divide-neutral-200">
              {group.items.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  isSelecting={isSelecting}
                  isSelected={selected.has(item.id)}
                  onToggleSelected={() => toggleSelected(item.id)}
                  onChange={(change) => updateItem.mutate({ id: item.id, change })}
                  onRename={() => setDialog({ item, session: Date.now() })}
                  onDelete={() => setDeleting(item)}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-400">
          Este checklist vale só para este cliente. A lista padrão fica em Configurações → Documentos.
        </p>
        <button
          type="button"
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className={`${secondaryButtonClassName} shrink-0`}
        >
          <RefreshCw className={`h-4 w-4 ${sync.isPending ? 'animate-spin' : ''}`} />
          Sincronizar com a lista da imobiliária
        </button>
      </div>

      {isSelecting && (
        // Fica acima da barra inferior do celular (h-16)
        <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-2 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-3 shadow-md lg:bottom-4">
          <span className="mr-auto text-sm font-medium text-neutral-900">
            {selected.size} {selected.size === 1 ? 'selecionado' : 'selecionados'}
          </span>
          {BULK_ACTIONS.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={selected.size === 0 || bulkUpdate.isPending}
              onClick={() => {
                bulkUpdate.mutate({ ids: Array.from(selected), status: action.status })
                exitSelection()
              }}
              className="h-11 rounded-[8px] bg-brand px-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50 sm:h-10"
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={exitSelection}
            aria-label="Sair da seleção"
            className="flex h-11 w-11 items-center justify-center rounded-[8px] text-neutral-400 hover:bg-neutral-100 sm:h-10 sm:w-10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {dialog && (
        <ChecklistItemDialog
          key={dialog.session}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          item={dialog.item}
          isSubmitting={addItem.isPending || updateItem.isPending}
          onSubmit={submitDialog}
        />
      )}

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{deleting?.name}&quot;</strong> sai do checklist deste cliente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:flex-row sm:justify-end sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) removeItem.mutate(deleting.id)
                setDeleting(null)
              }}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {draft && (
        <MessagePreviewDialog
          key={draft.session}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          lead={lead}
          draft={draft.draft}
        />
      )}
    </div>
  )
}
