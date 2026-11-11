'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Plan } from '@/services/billing.service'
import { formatMoney } from './constants'
import { clampSeats, isFixedSeats, MAX_SEATS, planTotal, shortfallMessage } from './subscription-rules'

export interface PlanChoice {
  planId: string
  seats: number
}

/** Três planos (só muda a quantidade de usuários) e o seletor de usuários em Equipe e Imobiliária */
export function PlanPicker({
  plans,
  value,
  onChange,
  activeUsers,
  currentPlanId,
}: {
  plans: Plan[]
  value: PlanChoice
  onChange: (choice: PlanChoice) => void
  activeUsers: number
  currentPlanId?: string
}) {
  const plan = plans.find((item) => item.id === value.planId) ?? plans[0]
  if (!plan) return null
  const seats = clampSeats(plan, value.seats)
  const fixed = isFixedSeats(plan)
  const shortfall = shortfallMessage(activeUsers, seats)

  function choose(next: Plan) {
    // Sugere o maior entre os incluídos e os usuários ativos
    onChange({ planId: next.id, seats: clampSeats(next, Math.max(next.seats, activeUsers)) })
  }

  function setSeats(next: number) {
    onChange({ planId: plan.id, seats: clampSeats(plan, next) })
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="sr-only">Plano</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {plans.map((item) => {
            const selected = item.id === plan.id
            return (
              <label
                key={item.id}
                className={cn(
                  'relative flex cursor-pointer flex-col rounded-[16px] border-[1.5px] p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
                  selected ? 'border-brand bg-brand-bg' : 'border-neutral-200 bg-white hover:border-neutral-400',
                )}
              >
                <input
                  type="radio"
                  name="plan"
                  value={item.id}
                  checked={selected}
                  onChange={() => choose(item)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-neutral-900">{item.name}</span>
                  {currentPlanId === item.id && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">Atual</span>
                  )}
                </span>
                <span className="mt-1 text-[20px] font-semibold text-neutral-900">
                  {formatMoney(item.price)}
                  <span className="text-xs font-normal text-neutral-400">/mês</span>
                </span>
                <span className="mt-1 text-xs text-neutral-600">
                  {isFixedSeats(item)
                    ? '1 usuário'
                    : `${item.seats} usuários inclusos, ${formatMoney(item.extraSeatPrice)} por usuário adicional`}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 rounded-[16px] bg-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        {fixed ? (
          <p className="text-sm font-medium text-neutral-900">1 usuário</p>
        ) : (
          <div className="flex items-center gap-3">
            <span id="seats-label" className="text-sm font-medium text-neutral-900">
              Usuários
            </span>
            <div className="flex items-center gap-2" role="group" aria-labelledby="seats-label">
              <button
                type="button"
                onClick={() => setSeats(seats - 1)}
                disabled={seats <= plan.seats}
                aria-label="Menos usuários"
                className="flex h-11 w-11 items-center justify-center rounded-[8px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={plan.seats}
                max={MAX_SEATS}
                value={seats}
                onChange={(event) => setSeats(event.target.valueAsNumber)}
                aria-label="Quantidade de usuários"
                className="h-11 w-16 rounded-[8px] border-[1.5px] border-neutral-200 bg-white text-center text-[15px] font-semibold text-neutral-900 outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() => setSeats(seats + 1)}
                disabled={seats >= MAX_SEATS}
                aria-label="Mais usuários"
                className="flex h-11 w-11 items-center justify-center rounded-[8px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        <p className="text-sm text-neutral-600" aria-live="polite">
          Total mensal{' '}
          <span className="ml-1 text-[22px] font-semibold text-neutral-900">{formatMoney(planTotal(plan, seats))}</span>
        </p>
      </div>

      {shortfall && (
        <p role="alert" className="rounded-[12px] bg-warning/10 px-3 py-2 text-sm text-warning">
          {shortfall}
        </p>
      )}
    </div>
  )
}
