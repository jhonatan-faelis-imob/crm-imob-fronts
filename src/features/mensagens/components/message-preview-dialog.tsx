'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { whatsappUrl } from '@/lib/whatsapp'
import { invalidateMyDayQueries } from '@/features/meu-dia/invalidate-my-day-queries'
import { messageTemplatesService } from '@/services/message-templates.service'
import type { Lead } from '@/types'
import { findPlaceholders } from '../constants'

export type WhatsAppLead = Pick<Lead, 'id' | 'name' | 'phone' | 'phone2'>

export interface MessageDraft {
  templateId: string | null
  templateName: string
  text: string
}

const secondaryClassName =
  'h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 sm:h-10'

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

  const fillVariables = useMutation({
    mutationFn: () => messageTemplatesService.renderFree(lead.id, text),
    onSuccess: (rendered) => setText(rendered.text),
    onError: () => toast.add({ title: 'Não foi possível preencher as variáveis', type: 'error' }),
  })

  const sendLog = useMutation({
    mutationFn: () =>
      draft.templateId
        ? messageTemplatesService.sendLog(draft.templateId, lead.id, text)
        : messageTemplatesService.sendLogFree(lead.id, text),
    onSuccess: () => {
      invalidateMyDayQueries(queryClient, lead.id)
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
      toast.add({ title: 'WhatsApp aberto. Interação registrada.', type: 'success' })
      onOpenChange(false)
    },
    onError: () => {
      toast.add({ title: 'WhatsApp aberto, mas a interação não foi registrada', type: 'error' })
      onOpenChange(false)
    },
  })

  function openWhatsApp() {
    // Precisa sair direto do clique: depois de um await o navegador bloqueia a nova aba
    const opened = window.open(whatsappUrl(phone, text), '_blank')
    if (!opened) {
      toast.add({ title: 'O navegador bloqueou a abertura do WhatsApp', type: 'error' })
      return
    }
    sendLog.mutate()
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text)
      toast.add({ title: 'Texto copiado', type: 'success' })
    } catch {
      toast.add({ title: 'Não foi possível copiar o texto', type: 'error' })
    }
  }

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

        {placeholders.length > 0 && (
          <div className="rounded-[12px] bg-[#FFF3E0] p-3 text-[13px] font-medium text-warning">
            <p>Não encontrei: {placeholders.join(', ')}. Complete o texto antes de enviar.</p>
            {!draft.templateId && (
              <button
                type="button"
                onClick={() => fillVariables.mutate()}
                disabled={fillVariables.isPending}
                className="mt-1 min-h-11 underline disabled:opacity-60"
              >
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
            disabled={!text.trim() || placeholders.length > 0 || sendLog.isPending}
            className="h-11 rounded-[8px] bg-[#25D366] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
          >
            Abrir no WhatsApp
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
