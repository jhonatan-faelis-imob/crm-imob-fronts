import {
  Building2,
  CalendarDays,
  ChartColumn,
  History,
  Kanban,
  ShieldCheck,
  Smartphone,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { Container, Eyebrow, SectionTitle } from './ui'

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Kanban, title: 'Leads em Kanban e lista', text: 'Etapas do funil personalizáveis e VGV potencial por coluna.' },
  { icon: CalendarDays, title: 'Tarefas e calendário', text: 'Cadência de follow-up encadeada, em lista ou agenda.' },
  {
    icon: Building2,
    title: 'Imóveis e lançamentos',
    text: 'Empreendimentos e revenda num catálogo visual, com status de cada unidade.',
  },
  { icon: History, title: 'Vendas com histórico', text: 'Cada mudança de status registrada, do sinal à escritura.' },
  { icon: Target, title: 'Metas em 3 níveis', text: 'Imobiliária, equipe e corretor, com acompanhamento diário.' },
  {
    icon: ChartColumn,
    title: 'Relatórios e dashboard',
    text: 'Conversão por etapa, desempenho por corretor e funil do mês.',
  },
  {
    icon: ShieldCheck,
    title: 'Equipes e permissões',
    text: 'Diretor, gerente, coordenador, corretor e administrativo — cada um vê o que deve ver.',
  },
  {
    icon: Smartphone,
    title: 'No celular',
    text: 'Instale como app e cadastre um lead em segundos, no plantão ou no stand.',
  },
]

export function Features() {
  return (
    <section className="bg-white py-20 md:py-28">
      <Container>
        <div data-reveal className="max-w-[760px]">
          <Eyebrow>Tudo conectado</Eyebrow>
          <SectionTitle>Do primeiro contato à venda assinada, num só sistema.</SectionTitle>
        </div>
        <ul data-reveal-stagger="70" className="mt-12 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} data-stagger-item className="lp-lift lp-lift-border rounded-[16px] border border-[#E6E2DD] p-6">
              <Icon className="h-6 w-6 text-[#C8104A]" aria-hidden="true" />
              <h3 className="mt-4 text-[17px] font-bold">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#57534E]">{text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
