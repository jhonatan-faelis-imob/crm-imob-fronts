'use client'

import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  isConfirming = false,
  destructive = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  isConfirming?: boolean
  destructive?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClick={(event) => event.stopPropagation()}
        className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0"
      >
        <DialogHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`rounded-[8px] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
              destructive ? 'bg-danger' : 'bg-brand'
            }`}
          >
            {isConfirming ? 'Aguarde...' : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
