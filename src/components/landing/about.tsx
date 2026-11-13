import { BellRing, Kanban, Sparkles, Target, type LucideIcon } from 'lucide-react'
import { Container, Eyebrow, SectionTitle } from './ui'

const PILLARS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Kanban,
    title: 'Organiza',
    text: 'Funil em Kanban com arrastar e soltar e o VGV de cada etapa na cabeça da coluna.',
  },
  {
    icon: BellRing,
    title: 'Lembra',
    text: 'Tarefas encadeadas: terminou uma, a próxima já nasce agendada. Nenhum follow-up cai.',
  },
  {
    icon: Target,
    title: 'Cobra',
    text: 'Metas da imobiliária, da equipe e do corretor, acompanhadas dia a dia no funil.',
  },
  {
    icon: Sparkles,
    title: 'Prioriza',
    text: 'IA que dá nota para cada lead e mostra quem está pronto para visita ou proposta.',
  },
]

export function About() {
  return (
    <section id="produto" className="scroll-mt-[72px] bg-white py-20 md:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-reveal>
          <Eyebrow>O que é o Smart CRM?</Eyebrow>
          <SectionTitle>Menos tempo atualizando cliente. Mais tempo vendendo.</SectionTitle>
          <p className="mt-6 text-[17px] leading-relaxed text-[#57534E]">
            O Smart CRM é uma plataforma feita para a rotina do corretor. Cada lead entra no funil, recebe um score de
            IA, ganha tarefas de follow-up encadeadas e alimenta as metas da equipe — sem planilha, sem caderno, sem
            cliente esquecido no WhatsApp.
          </p>
        </div>
        <ul data-reveal-stagger="80" className="grid gap-4 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <li key={title} data-stagger-item className="lp-lift rounded-[16px] bg-[#F7F5F3] p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white">
                <Icon className="lp-tilt h-5 w-5 text-[#C8104A]" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[18px] font-bold">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#57534E]">{text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
