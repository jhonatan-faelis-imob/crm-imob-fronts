'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/lib/use-is-mobile'
import type { Lead } from '@/types'
import { Simulator } from './simulator'

// Detalhe do lead: Dialog largo no desktop, Sheet em tela cheia no celular
export function SimulatorDialog({
  open,
  onOpenChange,
  lead,
  linkedPropertyIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead
  linkedPropertyIds: string[]
}) {
  const isMobile = useIsMobile()
  const title = `Simular — ${lead.name}`
  const body = open && <Simulator lead={lead} linkedPropertyIds={linkedPropertyIds} variant="sheet" />

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[100dvh] max-h-[100dvh] gap-0 overflow-y-auto rounded-none bg-[#F7F5F3] p-0">
          <SheetHeader className="sticky top-0 z-10 border-b-[0.5px] border-neutral-200 bg-white p-4 pr-12">
            <SheetTitle className="truncate">{title}</SheetTitle>
          </SheetHeader>
          <div className="p-4">{body}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-[#F7F5F3] p-4 ring-0 sm:max-w-5xl sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}
