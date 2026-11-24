'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/** 409 STAGE_IS_TERMINAL: Ganho e Perdido são lidas pelo nome nas regras de venda e de perda */
export function TerminalStageDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-line bg-paper p-0 ring-0">
        <AlertDialogHeader className="p-4 sm:p-6">
          <AlertDialogTitle>Esta etapa não pode ser renomeada</AlertDialogTitle>
          <AlertDialogDescription>
            Esta etapa controla o registro de vendas e de perdas. Renomeá-la quebraria esse fluxo. Você pode mudar a
            cor, ou só a forma do nome (por exemplo, maiúsculas e acentos).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mx-0 mb-0 rounded-b-2xl border-t-[0.5px] border-line bg-paper p-4 sm:p-6">
          <AlertDialogAction onClick={onClose} className="h-11 rounded-[8px] bg-brand px-4 text-paper hover:bg-ink sm:h-10">
            Entendi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
