'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const LOST_REASONS = [
  'Sem interesse',
  'Sem condição financeira',
  'Comprou com concorrente',
  'Não respondeu',
  'Outro',
] as const

export function LostReasonModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  isSubmitting?: boolean
}) {
  const [reason, setReason] = useState('')
  const [otherDetail, setOtherDetail] = useState('')

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason('')
      setOtherDetail('')
    }
    onOpenChange(next)
  }

  const finalReason = reason === 'Outro' ? otherDetail.trim() : reason
  const canConfirm = finalReason !== ''

  function handleConfirm() {
    if (!canConfirm) return
    onConfirm(finalReason)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Marcar como perdido</DialogTitle>
          <DialogDescription>Selecione o motivo da perda deste lead.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4 sm:p-6">
          <div>
            <label htmlFor="lost-reason" className="mb-1.5 block text-[13px] font-medium text-neutral-900">
              Motivo
            </label>
            <select
              id="lost-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand"
            >
              <option value="">Selecione um motivo</option>
              {LOST_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Outro' && (
            <div>
              <label
                htmlFor="lost-reason-detail"
                className="mb-1.5 block text-[13px] font-medium text-neutral-900"
              >
                Descreva o motivo
              </label>
              <textarea
                id="lost-reason-detail"
                value={otherDetail}
                onChange={(event) => setOtherDetail(event.target.value)}
                rows={3}
                placeholder="Conte o que aconteceu..."
                className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand"
              />
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className="rounded-[8px] bg-danger px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar perda'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
