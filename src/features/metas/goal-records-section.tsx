'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { addDays, parseLocalISODate, toLocalISODate } from '@/lib/date'
import { goalsService } from '@/services/goals.service'
import { lastRegisterableDay, type ApiGoal } from './api'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const RECENT_DAYS = 7

const arrowClassName =
  'flex h-11 w-11 items-center justify-center rounded-[8px] text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40'

function monthsBetween(start: string, end: string) {
  const months: string[] = []
  const cursor = parseLocalISODate(`${start.slice(0, 7)}-01`)
  while (toLocalISODate(cursor).slice(0, 7) <= end.slice(0, 7)) {
    months.push(toLocalISODate(cursor).slice(0, 7))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months
}

function daysOfMonth(month: string) {
  const first = parseLocalISODate(`${month}-01`)
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return {
    leadingBlanks: first.getDay(),
    days: Array.from({ length: total }, (_, index) => addDays(`${month}-01`, index)),
  }
}

function formatMonthLabel(month: string) {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    parseLocalISODate(`${month}-01`),
  )
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function GoalRecordsSection({
  goal,
  onSelectDay,
}: {
  goal: ApiGoal
  onSelectDay: (date: string) => void
}) {
  const today = toLocalISODate()
  const start = goal.periodStart.slice(0, 10)
  const end = lastRegisterableDay(goal, today)
  const months = monthsBetween(start, end)
  const [chosenMonth, setChosenMonth] = useState<string | undefined>(undefined)
  const month = chosenMonth && months.includes(chosenMonth) ? chosenMonth : months[months.length - 1]
  const monthIndex = months.indexOf(month)

  const { data: entries, isLoading, isError } = useQuery({
    queryKey: ['goal-entries', goal.id, start, end],
    queryFn: () => goalsService.getEntries(goal.id, { from: start, to: end }),
  })

  if (isLoading) return <Skeleton className="h-80 rounded-[16px]" />

  const recorded = new Set(entries?.map((entry) => entry.date.slice(0, 10)))
  // Hoje fica de fora: o dia ainda não acabou
  const missingRecently = Array.from({ length: RECENT_DAYS }, (_, index) => addDays(today, -(index + 1))).filter(
    (day) => day >= start && day <= end && !recorded.has(day),
  )
  const { leadingBlanks, days } = daysOfMonth(month)

  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <h2 className="text-[20px] font-semibold text-neutral-900">Seus registros</h2>

      {isError ? (
        <p className="mt-3 text-sm text-neutral-400">Não foi possível carregar seus registros.</p>
      ) : (
        <>
          {missingRecently.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-[12px] bg-neutral-100 py-1 pl-3 pr-1">
              <p className="text-[13px] text-neutral-600">
                Você tem {missingRecently.length} {missingRecently.length === 1 ? 'dia' : 'dias'} sem registro
              </p>
              <button
                type="button"
                onClick={() => onSelectDay(missingRecently[0])}
                className="h-11 shrink-0 rounded-[8px] px-3 text-sm font-medium text-brand transition-colors hover:bg-brand-bg"
              >
                Preencher
              </button>
            </div>
          )}

          <div className="mx-auto mt-3 max-w-md">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Mês anterior"
                disabled={monthIndex <= 0}
                onClick={() => setChosenMonth(months[monthIndex - 1])}
                className={arrowClassName}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-medium text-neutral-900">{formatMonthLabel(month)}</p>
              <button
                type="button"
                aria-label="Próximo mês"
                disabled={monthIndex >= months.length - 1}
                onClick={() => setChosenMonth(months[monthIndex + 1])}
                className={arrowClassName}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((weekday, index) => (
                <span key={index} className="text-center text-[11px] font-medium text-neutral-400">
                  {weekday}
                </span>
              ))}
              {Array.from({ length: leadingBlanks }, (_, index) => (
                <span key={`blank-${index}`} />
              ))}
              {days.map((day) => {
                const label = Number(day.slice(8))
                if (day < start || day > end) {
                  return (
                    <span key={day} className="flex h-11 items-center justify-center text-[13px] text-neutral-200">
                      {label}
                    </span>
                  )
                }

                const hasEntry = recorded.has(day)
                return (
                  <button
                    key={day}
                    type="button"
                    aria-label={`Dia ${label}, ${hasEntry ? 'com registro' : 'sem registro'}`}
                    aria-current={day === today ? 'date' : undefined}
                    onClick={() => onSelectDay(day)}
                    className={`relative flex h-11 items-center justify-center rounded-[8px] text-[13px] font-medium transition-opacity hover:opacity-80 ${
                      hasEntry ? 'bg-[#E8F5E9] text-success' : 'bg-neutral-100 text-neutral-400'
                    } ${day === today ? 'ring-[1.5px] ring-brand' : ''}`}
                  >
                    {label}
                    {!hasEntry && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
