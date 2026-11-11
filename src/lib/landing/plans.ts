export type PlanId = 'corretor' | 'equipe' | 'imobiliaria'

export type Plan = {
  id: PlanId
  name: string
  subtitle: string
  price: number
  includedUsers: number
  extraUserPrice: number | null
  usersLabel: string
  extraLabel: string | null
  /** Só o que é exclusivo do plano; os recursos são iguais em todos (PLAN_FEATURES) */
  extras: string[]
  featured: boolean
}

export const EXTRA_USER_PRICE = 30

/** Os planos diferem só na quantidade de usuários: nenhum recurso é travado por plano */
export const PLAN_FEATURES = [
  'Funil, leads e tarefas',
  'Metas e funil diário',
  'Score de IA nos leads',
  'Catálogo de imóveis',
  'Relatórios',
  'Hierarquia completa',
]

export const PLAN_CTA = { label: 'Começar teste', href: 'signup' } as const

export const PLANS: Plan[] = [
  {
    id: 'corretor',
    name: 'Corretor',
    subtitle: 'Para quem atende sozinho',
    price: 89.9,
    includedUsers: 1,
    extraUserPrice: null,
    usersLabel: '1 usuário',
    extraLabel: null,
    extras: [],
    featured: false,
  },
  {
    id: 'equipe',
    name: 'Equipe',
    subtitle: 'Para times de lançamento',
    price: 247,
    includedUsers: 5,
    extraUserPrice: EXTRA_USER_PRICE,
    usersLabel: '5 usuários inclusos',
    extraLabel: 'R$ 30 por usuário adicional',
    extras: [],
    featured: true,
  },
  {
    id: 'imobiliaria',
    name: 'Imobiliária',
    subtitle: 'Para várias equipes e diretoria',
    price: 699,
    includedUsers: 20,
    extraUserPrice: EXTRA_USER_PRICE,
    usersLabel: '20 usuários inclusos',
    extraLabel: 'R$ 30 por usuário adicional',
    extras: ['Implantação acompanhada'],
    featured: false,
  },
]

// Preço base + (usuários − inclusos) × adicional, nunca abaixo do preço base
export function planMonthlyTotal(plan: Plan, users: number) {
  if (plan.extraUserPrice === null) return plan.price
  const extra = Math.max(0, Math.floor(users) - plan.includedUsers)
  return plan.price + extra * plan.extraUserPrice
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value: number) {
  return brl.format(value)
}

// "R$ 89,90" / "R$ 247" — sem centavos quando o valor é inteiro
export function formatPlanPrice(value: number) {
  return Number.isInteger(value)
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
    : brl.format(value)
}
