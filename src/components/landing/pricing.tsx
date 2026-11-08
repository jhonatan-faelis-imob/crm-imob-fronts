import { Check } from 'lucide-react'
import { LINKS } from '@/lib/landing/links'
import { PLANS, formatPlanPrice, type Plan } from '@/lib/landing/plans'
import { PricingCalculator } from './pricing-calculator'
import { ButtonLink, Container, Eyebrow, SectionTitle } from './ui'

function PlanCard({ plan }: { plan: Plan }) {
  const dark = plan.featured
  return (
    <li
      className={`relative flex flex-col rounded-[20px] p-7 sm:p-8 ${
        dark ? 'bg-[#121212] text-white' : 'border border-[#E6E2DD] bg-white text-[#1C1B1A]'
      }`}
    >
      {dark && (
        <span className="absolute right-5 top-5 rounded-full bg-[#FF385C] px-3 py-1 text-[12px] font-bold text-[#121212]">
          Mais escolhido
        </span>
      )}
      <h3 className="text-[22px] font-extrabold tracking-[-0.02em]">{plan.name}</h3>
      <p className={`mt-1 text-[15px] ${dark ? 'text-[#BDB9B4]' : 'text-[#57534E]'}`}>{plan.subtitle}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-[40px] font-extrabold leading-none tracking-[-0.03em]">{formatPlanPrice(plan.price)}</span>
        <span className={`text-[15px] font-medium ${dark ? 'text-[#BDB9B4]' : 'text-[#57534E]'}`}>/mês</span>
      </p>
      <p className="mt-3 text-[15px] font-semibold">{plan.usersLabel}</p>
      <p className={`mt-1 min-h-[22px] text-[14px] ${dark ? 'text-[#BDB9B4]' : 'text-[#6B6762]'}`}>
        {plan.extraLabel ?? <span className="sr-only">Sem usuários adicionais</span>}
      </p>
      <ul className={`mt-6 space-y-3 border-t pt-6 ${dark ? 'border-white/15' : 'border-[#E6E2DD]'}`}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-[15px]">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? 'text-[#FF385C]' : 'text-[#C8104A]'}`}
              strokeWidth={3}
              aria-hidden="true"
            />
            <span className={dark ? 'text-white' : 'text-[#1C1B1A]'}>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">
        <ButtonLink
          href={plan.cta.href === 'signup' ? LINKS.signup : LINKS.sales}
          variant={dark ? 'primary' : 'outline-light-bg'}
          className="w-full"
        >
          {plan.cta.label}
        </ButtonLink>
      </div>
    </li>
  )
}

export function Pricing() {
  return (
    <section id="planos" className="scroll-mt-[72px] bg-[#F7F5F3] py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-[760px] text-center">
          <Eyebrow>Planos e preços</Eyebrow>
          <SectionTitle>Escolha o tamanho da sua operação.</SectionTitle>
        </div>
        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </ul>
        <PricingCalculator />
      </Container>
    </section>
  )
}
