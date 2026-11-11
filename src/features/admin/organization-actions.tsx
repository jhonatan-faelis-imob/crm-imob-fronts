'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { formatDay, PAYMENT_METHODS } from '@/features/assinatura/constants'
import { apiErrorMessage } from '@/features/equipe/api'
import { errorClassName, inputClassName, labelClassName } from '@/features/equipe/field'
import { adminService, type AdminOrganizationDetail } from '@/services/admin.service'
import { moneyInput, parseMoney, todayInput } from './rules'
import { invalidateAdmin } from './use-admin'

const dialogClassName =
  'flex max-h-[92vh] w-[calc(100%-1rem)] max-w-sm flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0'
const headerClassName = 'shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14'
const footerClassName =
  'mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6'
const cancelClassName =
  'min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100'

/** Bloquear ou desbloquear, com motivo obrigatório (vai para o histórico) */
export function ReasonDialog({
  organization,
  action,
  onClose,
}: {
  organization: AdminOrganizationDetail
  action: 'block' | 'unblock' | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const isBlock = action === 'block'

  const mutation = useMutation({
    mutationFn: () =>
      isBlock ? adminService.block(organization.id, reason.trim()) : adminService.unblock(organization.id, reason.trim()),
    onSuccess: () => {
      invalidateAdmin(queryClient)
      toast.add({ title: isBlock ? `${organization.name} bloqueada` : `${organization.name} desbloqueada`, type: 'success' })
      close()
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Não foi possível concluir. Tente de novo.')),
  })

  function close() {
    setReason('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={action !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className={dialogClassName}>
        <DialogHeader className={headerClassName}>
          <DialogTitle>{isBlock ? 'Bloquear imobiliária' : 'Desbloquear imobiliária'}</DialogTitle>
          <DialogDescription>
            {isBlock
              ? `${organization.name} fica somente leitura: vê tudo, mas não grava nada.`
              : `${organization.name} volta para a situação ativa.`}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 sm:p-6">
          <label htmlFor="reason" className={labelClassName}>
            Motivo
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={inputClassName}
          />
          {error && <p className={errorClassName}>{error}</p>}
        </div>
        <DialogFooter className={footerClassName}>
          <button type="button" onClick={close} className={cancelClassName}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={reason.trim() === '' || mutation.isPending}
            onClick={() => mutation.mutate()}
            className={`min-h-11 rounded-[8px] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
              isBlock ? 'bg-danger' : 'bg-success'
            }`}
          >
            {mutation.isPending ? 'Aguarde...' : isBlock ? 'Bloquear' : 'Desbloquear'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Registrar pagamento: o vencimento anda um mês e a situação volta para ativa */
export function PaymentDialog({
  organization,
  open,
  onClose,
}: {
  organization: AdminOrganizationDetail
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(moneyInput(organization.monthlyPrice))
  const [paidAt, setPaidAt] = useState(todayInput())
  const [method, setMethod] = useState<string>('pix')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const value = parseMoney(amount)

  const mutation = useMutation({
    mutationFn: () =>
      adminService.registerPayment(organization.id, {
        amount: value ?? 0,
        paidAt,
        method,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      invalidateAdmin(queryClient)
      toast.add({ title: 'Pagamento registrado', description: 'Vencimento adiado em um mês.', type: 'success' })
      onClose()
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Não foi possível registrar. Tente de novo.')),
  })

  const valid = value !== null && value > 0 && paidAt !== ''

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className={dialogClassName}>
        <DialogHeader className={headerClassName}>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            Vencimento atual: {formatDay(organization.currentPeriodEnd)}. Anda um mês a partir dele ou de hoje, o que
            for maior.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="payment-amount" className={labelClassName}>
                Valor (R$)
              </label>
              <input
                id="payment-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="payment-date" className={labelClassName}>
                Pago em
              </label>
              <input
                id="payment-date"
                type="date"
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
          <div>
            <label htmlFor="payment-method" className={labelClassName}>
              Forma
            </label>
            <select
              id="payment-method"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className={inputClassName}
            >
              {PAYMENT_METHODS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="payment-note" className={labelClassName}>
              Observação
            </label>
            <input
              id="payment-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={inputClassName}
            />
          </div>
          {error && <p className={errorClassName}>{error}</p>}
        </div>
        <DialogFooter className={footerClassName}>
          <button type="button" onClick={onClose} className={cancelClassName}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!valid || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="min-h-11 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {mutation.isPending ? 'Registrando...' : 'Registrar'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
