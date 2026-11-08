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
  features: string[]
  cta: { label: string; href: 'signup' | 'sales' }
  featured: boolean
}

export const EXTRA_USER_PRICE = 30

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
    features: ['Funil, leads e tarefas', 'Score de IA nos leads', 'Metas individuais'],
    cta: { label: 'Começar teste', href: 'signup' },
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
    extraLabel: '+ R$ 30 por usuário adicional',
    features: [
      'Tudo do plano Corretor',
      'Metas por equipe e funil diário',
      'Coordenador vê o time',
      'Relatórios de desempenho',
    ],
    cta: { label: 'Começar teste', href: 'signup' },
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
    extraLabel: '+ R$ 30 por usuário adicional',
    features: [
      'Tudo do plano Equipe',
      '5 níveis de hierarquia',
      'Catálogo de imóveis e vendas',
      'Implantação acompanhada',
    ],
    cta: { label: 'Falar com vendas', href: 'sales' },
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
