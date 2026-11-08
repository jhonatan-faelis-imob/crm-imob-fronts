'use client'

import { Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { PLANS, formatBRL, planMonthlyTotal, type PlanId } from '@/lib/landing/plans'

const MAX_USERS = 500

export function PricingCalculator() {
  const [planId, setPlanId] = useState<PlanId>('equipe')
  const [users, setUsers] = useState(5)
  const usersId = useId()

  const plan = PLANS.find((item) => item.id === planId) ?? PLANS[0]
  const fixed = plan.extraUserPrice === null
  const effectiveUsers = fixed ? plan.includedUsers : users
  const total = planMonthlyTotal(plan, effectiveUsers)
  const extraUsers = Math.max(0, effectiveUsers - plan.includedUsers)

  const choosePlan = (id: PlanId) => {
    const next = PLANS.find((item) => item.id === id)
    if (!next) return
    setPlanId(id)
    setUsers(next.includedUsers)
  }

  const changeUsers = (value: number) => {
    if (Number.isNaN(value)) return
    setUsers(Math.min(MAX_USERS, Math.max(1, Math.floor(value))))
  }

  return (
    <div className="mx-auto mt-10 max-w-[860px] rounded-[20px] border border-[#E6E2DD] bg-white p-6 sm:p-8">
      <h3 className="text-[20px] font-extrabold tracking-[-0.02em]">Calcule o valor da sua equipe</h3>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <fieldset>
          <legend className="text-[14px] font-semibold text-[#57534E]">Plano</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PLANS.map((item) => (
              <label
                key={item.id}
                className={`flex min-h-12 cursor-pointer items-center justify-center rounded-[12px] border px-2 text-center text-[14px] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#FF385C] ${
                  item.id === planId
                    ? 'border-[#1C1B1A] bg-[#1C1B1A] text-white'
                    : 'border-[#E6E2DD] text-[#1C1B1A] hover:border-[#1C1B1A]'
                }`}
              >
                <input
                  type="radio"
                  name="landing-plan"
                  value={item.id}
                  checked={item.id === planId}
                  onChange={() => choosePlan(item.id)}
                  className="sr-only"
                />
                {item.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={usersId} className="text-[14px] font-semibold text-[#57534E]">
            Usuários
          </label>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeUsers(effectiveUsers - 1)}
              disabled={fixed || effectiveUsers <= 1}
              aria-label="Diminuir usuários"
              className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#E6E2DD] text-[#1C1B1A] hover:border-[#1C1B1A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <input
              id={usersId}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_USERS}
              value={effectiveUsers}
              disabled={fixed}
              onChange={(event) => changeUsers(event.target.valueAsNumber)}
              className="h-12 w-20 rounded-[12px] border border-[#E6E2DD] text-center text-[16px] font-semibold text-[#1C1B1A] focus:border-[#E31C5F] focus:outline-none disabled:bg-[#F7F5F3]"
            />
            <button
              type="button"
              onClick={() => changeUsers(effectiveUsers + 1)}
              disabled={fixed || effectiveUsers >= MAX_USERS}
              aria-label="Aumentar usuários"
              className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#E6E2DD] text-[#1C1B1A] hover:border-[#1C1B1A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1 rounded-[16px] bg-[#F7F5F3] p-5 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[14px] text-[#57534E]">
          {fixed
            ? 'O plano Corretor é para 1 usuário.'
            : extraUsers > 0
              ? `${formatBRL(plan.price)} + ${extraUsers} ${extraUsers === 1 ? 'usuário adicional' : 'usuários adicionais'} × ${formatBRL(plan.extraUserPrice ?? 0)}`
              : `${plan.includedUsers} usuários inclusos no plano ${plan.name}.`}
        </p>
        <p className="text-[14px] font-semibold text-[#57534E]" aria-live="polite">
          Total mensal{' '}
          <span className="ml-1 text-[28px] font-extrabold tracking-[-0.02em] text-[#1C1B1A]">{formatBRL(total)}</span>
        </p>
      </div>
    </div>
  )
}
