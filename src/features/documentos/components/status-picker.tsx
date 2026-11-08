'use client'

import { useState, type ReactElement } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useIsMobile } from '@/lib/use-is-mobile'
import { cn } from '@/lib/utils'
import type { ChecklistItem, ChecklistStatus } from '@/types'
import { CHECKLIST_STATUSES, CHECKLIST_STATUS_META } from '../constants'

function PickerBody({
  item,
  onSave,
}: {
  item: ChecklistItem
  onSave: (change: { status: ChecklistStatus; notes: string }) => void
}) {
  const [status, setStatus] = useState(item.status)
  const [notes, setNotes] = useState(item.notes ?? '')

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-1.5">
        {CHECKLIST_STATUSES.map((value) => {
          const meta = CHECKLIST_STATUS_META[value]
          const Icon = meta.icon
          const isSelected = status === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              aria-pressed={isSelected}
              className={cn(
                'flex min-h-11 items-center gap-2.5 rounded-[8px] border-[1.5px] px-3 text-left text-sm font-medium transition-colors sm:min-h-10',
                isSelected ? 'border-brand' : 'border-transparent hover:bg-neutral-100',
              )}
            >
              <Icon className="h-4 w-4" style={{ color: meta.text }} />
              <span className={meta.strike ? 'line-through' : undefined}>{meta.label}</span>
            </button>
          )
        })}
      </div>
      <div>
        <label htmlFor={`notes-${item.id}`} className="text-[13px] font-medium text-neutral-900">
          Observação
        </label>
        <textarea
          id={`notes-${item.id}`}
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex.: holerite de agosto está ilegível"
          className="mt-1.5 w-full resize-none rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none focus:border-brand sm:text-sm"
        />
      </div>
      <button
        type="button"
        onClick={() => onSave({ status, notes })}
        className="h-11 w-full rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark sm:h-10"
      >
        Salvar
      </button>
    </div>
  )
}

// Popover no desktop, Sheet inferior no celular; a escolha só vale ao tocar em Salvar
export function StatusPicker({
  item,
  trigger,
  onSave,
}: {
  item: ChecklistItem
  trigger: ReactElement
  onSave: (change: { status: ChecklistStatus; notes: string }) => void
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  function save(change: { status: ChecklistStatus; notes: string }) {
    setOpen(false)
    onSave(change)
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={trigger} />
        <SheetContent side="bottom" className="max-h-[85vh] gap-2 overflow-y-auto rounded-t-[20px] bg-white pb-6">
          <SheetHeader className="pb-0">
            <SheetTitle className="break-words pr-8">{item.name}</SheetTitle>
          </SheetHeader>
          <div className="px-4">{open && <PickerBody item={item} onSave={save} />}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className="w-72 bg-white">
        {open && <PickerBody item={item} onSave={save} />}
      </PopoverContent>
    </Popover>
  )
}
