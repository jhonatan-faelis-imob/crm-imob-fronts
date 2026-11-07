'use client'

import { useState } from 'react'
import { addDays, parseLocalISODate, toLocalISODate } from '@/lib/date'
import { ResponsiveModal } from './responsive-modal'

export function PickReturnDateDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (date: Date) => void
}) {
  const today = toLocalISODate()
  const [day, setDay] = useState(addDays(today, 1))
  const isValid = day >= today

  function confirm() {
    const date = parseLocalISODate(day)
    onConfirm(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0))
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Agendar retorno">
      <div className="min-w-0 space-y-4">
        <div>
          <label htmlFor="return-date" className="text-[13px] font-medium text-neutral-900">
            Data do retorno
          </label>
          <input
            id="return-date"
            type="date"
            min={today}
            value={day}
            onChange={(event) => setDay(event.target.value)}
            className="mt-1.5 w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand"
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!isValid}
            className="h-11 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            Agendar
          </button>
        </div>
      </div>
    </ResponsiveModal>
  )
}
