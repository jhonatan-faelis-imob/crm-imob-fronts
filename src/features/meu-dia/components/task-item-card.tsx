'use client'

import { CheckCircle2, Clock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TASK_TYPE_META } from '@/features/tarefas/constants'
import type { MyDayItem, MyDayTask } from '@/types'
import { POSTPONE_OPTIONS, formatTaskDate, postponedDate } from '../constants'
import { ItemRibbon, ReasonChips } from './item-parts'

const actionClassName =
  'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] border-[0.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 sm:flex-none'

export function TaskItemCard({
  item,
  task,
  highlight,
  onComplete,
  onPostpone,
}: {
  item: MyDayItem
  task: MyDayTask
  highlight: boolean
  onComplete: () => void
  onPostpone: (date: Date) => void
}) {
  const type = TASK_TYPE_META[task.type]
  const Icon = type.icon

  return (
    <article className="overflow-hidden rounded-[16px] border-[0.5px] border-neutral-200 bg-white">
      {highlight && <ItemRibbon />}
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: type.bg, color: type.text }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="break-words text-base font-medium text-neutral-900">{task.title}</p>
            <p className="text-sm text-neutral-400">{formatTaskDate(task.dueDate)}</p>
          </div>
        </div>

        <ReasonChips reasons={item.reasons} />

        <div className="flex gap-1.5">
          <button type="button" onClick={onComplete} className={actionClassName}>
            <CheckCircle2 className="h-4 w-4" />
            Concluir
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<button type="button" className={actionClassName} />}>
              <Clock className="h-4 w-4" />
              Adiar
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-white">
              {POSTPONE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.label}
                  className="min-h-11 sm:min-h-8"
                  onClick={() => onPostpone(postponedDate(task, option.days()))}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  )
}
