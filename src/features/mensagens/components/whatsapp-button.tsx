'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/lib/use-is-mobile'
import { whatsappUrl } from '@/lib/whatsapp'
import type { MessageTemplate } from '@/types'
import { MessagePreviewDialog, type MessageDraft, type WhatsAppLead } from './message-preview-dialog'
import { TemplatePicker } from './template-picker'
import { useMessageContext } from '../use-message-context'
import { buildDraft } from '../utils/send-message'

const PICKER_TITLE = 'Enviar WhatsApp'

const TRIGGER_CLASS_NAME = {
  primary:
    'inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#25D366] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90',
  compact:
    'flex min-h-9 items-center gap-1 rounded-[8px] bg-[#25D366] px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90',
  icon: 'inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-[8px] bg-[#25D366] text-sm font-medium text-white transition-opacity hover:opacity-90 sm:px-3',
}

// Cada prévia remonta o modal com o texto novo. O texto é montado no navegador (renderTemplateLocal):
// nenhuma chamada de render, salvo {{documentos_pendentes}}, que o modal busca sozinho
function useMessagePreview(lead: WhatsAppLead) {
  const messageContext = useMessageContext(lead)
  const [draft, setDraft] = useState<MessageDraft | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState(0)

  function show(nextDraft: MessageDraft) {
    setDraft(nextDraft)
    setSession((current) => current + 1)
    setIsOpen(true)
  }

  // Dados já em cache (buscados ao abrir o seletor): a prévia abre na hora. Falha de rede não impede:
  // a variável sem valor fica destacada no texto
  async function choose(template: MessageTemplate | null) {
    show(await buildDraft(template, messageContext.load))
  }

  return { draft, isOpen, setIsOpen, session, choose, prefetch: messageContext.prefetch }
}

export function WhatsAppButton({
  lead,
  variant = 'primary',
  initialPhone,
  allowOpenBlank = false,
}: {
  lead: WhatsAppLead
  variant?: keyof typeof TRIGGER_CLASS_NAME
  initialPhone?: string
  allowOpenBlank?: boolean
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const isMobile = useIsMobile()
  const preview = useMessagePreview(lead)

  function choose(template: MessageTemplate | null) {
    setIsPickerOpen(false)
    void preview.choose(template)
  }

  function setPickerOpen(open: boolean) {
    if (open) preview.prefetch()
    setIsPickerOpen(open)
  }

  function openBlank() {
    setIsPickerOpen(false)
    window.open(whatsappUrl(initialPhone ?? lead.phone), '_blank')
  }

  const picker = <TemplatePicker onChoose={choose} onOpenBlank={allowOpenBlank ? openBlank : undefined} />
  const label = (
    <>
      <MessageCircle className={variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'} />
      <span className={variant === 'icon' ? 'sr-only sm:not-sr-only' : undefined}>WhatsApp</span>
    </>
  )

  return (
    <>
      {isMobile ? (
        <>
          <button type="button" onClick={() => setPickerOpen(true)} className={TRIGGER_CLASS_NAME[variant]}>
            {label}
          </button>
          <PickerSheet open={isPickerOpen} onOpenChange={setIsPickerOpen}>
            {picker}
          </PickerSheet>
        </>
      ) : (
        <Popover open={isPickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger render={<button type="button" className={TRIGGER_CLASS_NAME[variant]} />}>
            {label}
          </PopoverTrigger>
          <PopoverContent align="end" className="flex max-h-[420px] w-80 flex-col bg-white">
            {picker}
          </PopoverContent>
        </Popover>
      )}

      {preview.draft && (
        <MessagePreviewDialog
          key={preview.session}
          open={preview.isOpen}
          onOpenChange={preview.setIsOpen}
          lead={lead}
          draft={preview.draft}
          initialPhone={initialPhone}
        />
      )}
    </>
  )
}

// Para quem abre a escolha por um item de menu: não há botão onde ancorar o popover
export function WhatsAppPickerDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: WhatsAppLead
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const preview = useMessagePreview(lead)

  function choose(template: MessageTemplate | null) {
    onOpenChange(false)
    void preview.choose(template)
  }

  // Quem abre é o pai (menu do cartão do Kanban): busca os dados das variáveis assim que abre
  const { prefetch } = preview
  useEffect(() => {
    if (open) prefetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      {isMobile ? (
        <PickerSheet open={open} onOpenChange={onOpenChange}>
          <TemplatePicker onChoose={choose} />
        </PickerSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="flex max-h-[70vh] flex-col rounded-2xl border-[0.5px] border-neutral-200 bg-white ring-0">
            <DialogHeader>
              <DialogTitle>{PICKER_TITLE}</DialogTitle>
            </DialogHeader>
            <TemplatePicker onChoose={choose} />
          </DialogContent>
        </Dialog>
      )}

      {preview.draft && (
        <MessagePreviewDialog
          key={preview.session}
          open={preview.isOpen}
          onOpenChange={preview.setIsOpen}
          lead={lead}
          draft={preview.draft}
        />
      )}
    </>
  )
}

function PickerSheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] gap-2 rounded-t-[20px] bg-white pb-4">
        <SheetHeader className="pb-0">
          <SheetTitle>{PICKER_TITLE}</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col px-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
