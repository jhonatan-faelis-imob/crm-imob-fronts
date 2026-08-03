'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Task } from '@/types'
import { TASK_TYPE_META } from './constants'
import { formatGroupDate, isOverdue, isSameDay } from './date-utils'
import { TaskCard } from './task-card'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MAX_VISIBLE_PILLS = 3

function getCalendarDays(monthDate: Date): Date[] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
}

export function TaskCalendarView({
  tasks,
  newTaskId,
  onComplete,
  onEdit,
  onDelete,
}: {
  tasks: Task[]
  newTaskId?: string | null
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const days = getCalendarDays(currentMonth)
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentMonth)

  function goToMonth(offset: number) {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  function goToToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDay(today)
  }

  const selectedDayTasks = selectedDay
    ? tasks
        .filter((task) => isSameDay(new Date(task.dueDate), selectedDay))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    : []

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold capitalize text-neutral-900">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToToday}
              className="rounded-[8px] border-[1.5px] border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-brand hover:text-brand"
            >
              Hoje
            </button>
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => goToMonth(-1)}
              className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => goToMonth(1)}
              className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayTasks = tasks
              .filter((task) => isSameDay(new Date(task.dueDate), day))
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
            const isTodayCell = isSameDay(day, today)
            const isSelected = selectedDay !== null && isSameDay(day, selectedDay)
            const hasOverdue = dayTasks.some((task) => task.status === 'pendente' && isOverdue(task.dueDate))
            const visiblePills = dayTasks.slice(0, MAX_VISIBLE_PILLS)
            const hiddenCount = dayTasks.length - visiblePills.length

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`min-h-[92px] rounded-[10px] border-[0.5px] p-1.5 text-left align-top transition-colors ${
                  isSelected ? 'border-brand' : 'border-neutral-200'
                } ${hasOverdue ? 'bg-[#FFF5F5]' : 'bg-white hover:bg-neutral-100'} ${
                  isCurrentMonth ? '' : 'opacity-40'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isTodayCell ? 'bg-brand text-white' : 'text-neutral-900'
                  }`}
                >
                  {day.getDate()}
                </span>

                <div className="mt-1 space-y-1">
                  {visiblePills.map((task) => {
                    const meta = TASK_TYPE_META[task.type]
                    return (
                      <p
                        key={task.id}
                        className="truncate rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: meta.bg, color: meta.text }}
                      >
                        {task.title}
                      </p>
                    )
                  })}
                  {hiddenCount > 0 && (
                    <span
                      role="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedDay(day)
                      }}
                      className="block text-[10px] font-medium text-neutral-400 hover:text-brand"
                    >
                      +{hiddenCount} mais
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="shrink-0 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 sm:p-5 lg:w-80">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">{formatGroupDate(selectedDay)}</h3>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-900"
            >
              Fechar
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {selectedDayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                parentTask={task.parentTaskId ? tasks.find((item) => item.id === task.parentTaskId) : undefined}
                isNew={task.id === newTaskId}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {selectedDayTasks.length === 0 && (
              <p className="text-sm text-neutral-400">Nenhuma tarefa neste dia.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
