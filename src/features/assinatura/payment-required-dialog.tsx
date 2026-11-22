'use client'

import { Lock, UsersRound } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePaywallStore } from '@/store/paywall.store'
import { SupportButton } from './support-button'

/** Aberto pelo interceptor em qualquer 402. Não desloga */
export function PaymentRequiredDialog() {
  const { open, code, message, close } = usePaywallStore()
  const isSeatLimit = code === 'SEAT_LIMIT'
  const Icon = isSeatLimit ? UsersRound : Lock

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-[0.5px] border-line bg-paper p-0 ring-0">
        <DialogHeader className="gap-2 border-b-[0.5px] border-line p-4 pr-12 sm:p-6 sm:pr-14">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-line text-brand">
            <Icon className="h-5 w-5" />
          </span>
          <DialogTitle>{isSeatLimit ? 'Limite de usuários atingido' : 'Assinatura bloqueada'}</DialogTitle>
          <DialogDescription>
            {message}
            {isSeatLimit ? ' Você também pode desativar alguém que não usa mais o sistema.' : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 rounded-b-2xl border-t-[0.5px] border-line bg-paper p-4 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-[8px] border-[1.5px] border-line px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-canvas"
          >
            Fechar
          </button>
          <SupportButton
            text={isSeatLimit ? 'Olá! Quero ampliar o número de usuários do Smart CRM.' : 'Olá! Quero reativar a assinatura do Smart CRM.'}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
