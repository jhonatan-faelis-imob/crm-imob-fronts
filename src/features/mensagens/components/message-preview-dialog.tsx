'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { whatsappUrl } from '@/lib/whatsapp'
import { invalidateMyDayQueries } from '@/features/meu-dia/invalidate-my-day-queries'
import { messageTemplatesService } from '@/services/message-templates.service'
import type { MessageLead } from '../use-message-context'
import { findPlaceholders } from '../constants'
import { DOCUMENTS_VARIABLE, fillPendingDocuments, hasPendingDocumentsVariable } from '../utils/render-template'
import { openWhatsAppAndLog, prepareMessage, type MessageDraft } from '../utils/send-message'

export type WhatsAppLead = MessageLead

export type { MessageDraft }

const secondaryClassName =
  'h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 sm:h-10'

/**
 * Só {{documentos_pendentes}} precisa do servidor (checklist do lead). Pede o render da variável sozinha
 * e devolve null quando o lead não tem documento pendente (a variável continua no texto, como no backend)
 */
export async function fetchPendingDocuments(leadId: string): Promise<string | null> {
  const rendered = await messageTemplatesService.renderFree(leadId, `{{${DOCUMENTS_VARIABLE}}}`)
  return rendered.missing.includes(DOCUMENTS_VARIABLE) ? null : rendered.text
}

export function MessagePreviewDialog({
  open,
  onOpenChange,
  lead,
  draft,
  initialPhone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: WhatsAppLead
  draft: MessageDraft
  initialPhone?: string
}) {
  const queryClient = useQueryClient()
  const [text, setText] = useState(draft.text)
  const [phone, setPhone] = useState(initialPhone ?? lead.phone)
  const placeholders = findPlaceholders(text)

  const documents = useMutation({
    mutationFn: () => fetchPendingDocuments(lead.id),
    onSuccess: (value) => {
      if (value) setText((current) => fillPendingDocuments(current, value))
    },
    onError: (error) => console.error('Mensagem do WhatsApp: falha ao buscar documentos pendentes', error),
  })

  // Única chamada de render: quando o texto pede {{documentos_pendentes}}. A prévia já está aberta com o resto
  useEffect(() => {
    if (hasPendingDocumentsVariable(draft.text)) documents.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function fillVariables() {
    if (!draft.context) return
    const prepared = prepareMessage(text, draft.context)
    setText(prepared.text)
    if (prepared.needsDocuments) documents.mutate()
  }

  function logged() {
    invalidateMyDayQueries(queryClient, lead.id)
    queryClient.invalidateQueries({ queryKey: ['message-templates'] })
  }

  function logFailed(error: unknown, retry: () => Promise<unknown>) {
    console.error('Mensagem do WhatsApp: falha ao registrar a interação', error)
    toast.add({
      title: 'WhatsApp aberto, mas não consegui registrar a interação',
      type: 'error',
      timeout: 15_000,
      actionProps: {
        children: 'Registrar agora',
        onClick: () => {
          retry().then(
            () => {
              logged()
              toast.add({ title: 'Interação registrada', type: 'success' })
            },
            (retryError: unknown) => logFailed(retryError, retry),
          )
        },
      },
    })
  }

  function openWhatsApp() {
    // O texto enviado fica fixo: "Registrar agora" registra o mesmo texto, mesmo com o modal fechado
    const sentText = text
    const log = () =>
      draft.templateId
        ? messageTemplatesService.sendLog(draft.templateId, lead.id, sentText)
        : messageTemplatesService.sendLogFree(lead.id, sentText)
    const opened = openWhatsAppAndLog({
      url: whatsappUrl(phone, text),
      // Síncrono, direto do clique: depois de um await o navegador bloquearia a nova aba
      openWindow: (url) => window.open(url, '_blank'),
      log,
      onLogged: () => {
        logged()
        toast.add({ title: 'WhatsApp aberto. Interação registrada.', type: 'success' })
      },
      onLogFailed: (error) => logFailed(error, log),
    })
    if (!opened) {
      toast.add({ title: 'O navegador bloqueou a abertura do WhatsApp', type: 'error' })
      return
    }
    onOpenChange(false)
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text)
      toast.add({ title: 'Texto copiado', type: 'success' })
    } catch {
      toast.add({ title: 'Não foi possível copiar o texto', type: 'error' })
    }
  }

  const documentsMissing = placeholders.includes(DOCUMENTS_VARIABLE)
  const otherPlaceholders = placeholders.filter((name) => name !== DOCUMENTS_VARIABLE)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white ring-0 sm:max-w-md">
        <DialogHeader className="gap-1 pr-8">
          <DialogTitle>{draft.templateName}</DialogTitle>
          <DialogDescription>Para {lead.name}. Revise o texto antes de abrir o WhatsApp.</DialogDescription>
        </DialogHeader>

        {lead.phone2 && (
          <div>
            <label htmlFor="whatsapp-phone" className="text-[13px] font-medium text-neutral-900">
              Número
            </label>
            <select
              id="whatsapp-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1.5 w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand"
            >
              <option value={lead.phone}>{lead.phone} (principal)</option>
              <option value={lead.phone2}>{lead.phone2}</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="whatsapp-text" className="text-[13px] font-medium text-neutral-900">
            Mensagem
          </label>
          <textarea
            id="whatsapp-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            className="mt-1.5 w-full resize-none rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand"
          />
        </div>

        {documentsMissing && documents.isPending && (
          <p className="flex items-center gap-2 text-[13px] text-neutral-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Buscando os documentos pendentes...
          </p>
        )}

        {documentsMissing && documents.isError && (
          <div className="rounded-[12px] bg-[#FFF3E0] p-3 text-[13px] font-medium text-warning">
            <p>Não consegui buscar os documentos pendentes. Complete o texto à mão ou tente de novo.</p>
            <button type="button" onClick={() => documents.mutate()} className="mt-1 min-h-11 underline">
              Tentar de novo
            </button>
          </div>
        )}

        {(otherPlaceholders.length > 0 || (documentsMissing && !documents.isPending && !documents.isError)) && (
          <div className="rounded-[12px] bg-[#FFF3E0] p-3 text-[13px] font-medium text-warning">
            <p>Não encontrei: {placeholders.join(', ')}. Complete o texto antes de enviar.</p>
            {!draft.templateId && draft.context && (
              <button type="button" onClick={fillVariables} className="mt-1 min-h-11 underline">
                Preencher variáveis
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={copyText} className={`${secondaryClassName} sm:mr-auto`}>
            Copiar texto
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className={secondaryClassName}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={openWhatsApp}
            disabled={!text.trim() || placeholders.length > 0}
            className="h-11 rounded-[8px] bg-[#25D366] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
          >
            Abrir no WhatsApp
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
