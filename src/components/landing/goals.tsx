import { Container, Eyebrow, MockupFrame, SectionTitle } from './ui'

const DAILY = [
  { label: 'Leads hoje', value: '12/15' },
  { label: 'Visitas', value: '4/5' },
  { label: 'Propostas', value: '2/2' },
]

const RANKING = [
  { name: 'Bruno', pct: 92 },
  { name: 'Larissa', pct: 74 },
  { name: 'Diego', pct: 48 },
]

function GoalsMockup() {
  return (
    <MockupFrame>
      <figure>
        <figcaption className="sr-only">Exemplo de meta da equipe em 70%, com funil do dia e ranking de corretores.</figcaption>
        <p className="text-[14px] font-semibold text-[#57534E]">Meta da equipe · Novembro</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[24px] font-extrabold tracking-[-0.02em] sm:text-[28px]">
            R$ 4,2 mi <span className="text-[16px] font-semibold text-[#6B6762]">de R$ 6 mi</span>
          </p>
          <span className="rounded-full bg-[#FFE4EA] px-2.5 py-1 text-[13px] font-bold text-[#B00D40]">70%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#F1EEEA]" aria-hidden="true">
          <div className="h-full w-[70%] rounded-full bg-[#FF385C]" />
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-3">
          {DAILY.map((item) => (
            <li key={item.label} className="rounded-[14px] bg-[#F7F5F3] p-3 sm:p-4">
              <p className="text-[12px] font-medium text-[#57534E] sm:text-[13px]">{item.label}</p>
              <p className="mt-1 text-[20px] font-extrabold">{item.value}</p>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-[14px] font-bold">Ranking do mês</p>
        <ul className="mt-3 space-y-3">
          {RANKING.map((item) => (
            <li key={item.name} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[14px] font-medium">{item.name}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1EEEA]" aria-hidden="true">
                <span className="block h-full rounded-full bg-[#1C1B1A]" style={{ width: `${item.pct}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right text-[14px] font-bold">{item.pct}%</span>
            </li>
          ))}
        </ul>
      </figure>
    </MockupFrame>
  )
}

export function Goals() {
  return (
    <section id="metas" className="scroll-mt-[72px] bg-[#F7F5F3] py-20 md:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow>Metas e tarefas</Eyebrow>
          <SectionTitle>Meta batida é rotina, não sorte.</SectionTitle>
          <p className="mt-6 text-[17px] leading-relaxed text-[#57534E]">
            Defina metas para a imobiliária, para cada equipe e para cada corretor. O CRM Imob quebra a meta do mês em
            números do dia — leads, visitas, propostas — e mostra quem está no ritmo.
          </p>
        </div>
        <GoalsMockup />
      </Container>
    </section>
  )
}
