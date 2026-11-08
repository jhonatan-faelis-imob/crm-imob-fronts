import { CountUp } from './count-up'
import { motionVars } from './motion-vars'
import { CheckItem, Container, Eyebrow, MockupFrame, SectionTitle } from './ui'

const REASONS = [
  'Respondeu as últimas 3 mensagens no mesmo dia',
  'Pediu simulação de financiamento',
  'Visitou o decorado há 2 dias',
]

const TIMELINE = [
  { title: 'Follow-up: enviar tabela atualizada', when: 'Hoje, 14h', current: true },
  { title: 'Visita ao decorado', when: '06/11', current: false },
  { title: 'Lead recebido · Instagram', when: '01/11', current: false },
]

function LeadScoreMockup() {
  return (
    <MockupFrame reveal="right">
      <figure>
        <figcaption className="sr-only">Exemplo de lead com score de IA 87 e os motivos da nota.</figcaption>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFE4EA] text-[15px] font-bold text-[#B00D40]">
            JP
          </span>
          <div className="min-w-0">
            <p className="text-[16px] font-bold">Juliana Prado</p>
            <p className="text-[13px] text-[#57534E]">Lançamento · 3 dorm. · até R$ 650 mil</p>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[56px] font-extrabold leading-none tracking-[-0.03em] text-[#1C1B1A]">
              <CountUp value={87} delay={300} duration={900} />
            </p>
            <p className="mt-1 text-[14px] font-semibold text-[#C8104A]">Lead quente</p>
          </div>
          <p className="text-[13px] text-[#6B6762]">Score de IA · 0 a 100</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F1EEEA]" aria-hidden="true">
          {/* scaleX em vez de width: a barra cresce sincronizada com a contagem */}
          <div
            className="lp-in h-full w-full origin-left scale-x-[0.87] rounded-full bg-[#FF385C]"
            style={motionVars({ d: 300, anim: 'lp-bar', dur: 900 })}
          />
        </div>

        <div className="mt-6 rounded-[16px] bg-[#F7F5F3] p-4">
          <p className="text-[14px] font-bold">Por que 87?</p>
          <ul className="mt-2 space-y-1.5">
            {REASONS.map((reason, index) => (
              <li
                key={reason}
                className="lp-in flex gap-2 text-[14px] text-[#57534E]"
                style={motionVars({ d: 500 + index * 80 })}
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8104A]" aria-hidden="true" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-[14px] font-bold">Linha do tempo</p>
        <ol className="mt-3 space-y-3">
          {TIMELINE.map((item, index) => (
            <li key={item.title} className="flex items-start gap-3">
              {/* Os pontos acendem de baixo para cima */}
              <span
                style={motionVars({ d: 800 + (TIMELINE.length - 1 - index) * 160, anim: 'lp-dot', dur: 500 })}
                className={`lp-in mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.current ? 'bg-[#FF385C]' : 'bg-[#D6D1CB]'}`}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 flex-wrap justify-between gap-x-3">
                <span className="text-[14px] font-medium text-[#1C1B1A]">{item.title}</span>
                <span className="text-[13px] text-[#6B6762]">{item.when}</span>
              </div>
            </li>
          ))}
        </ol>
      </figure>
    </MockupFrame>
  )
}

export function Ai() {
  return (
    <section id="ia" className="scroll-mt-[72px] bg-[#F7F5F3] py-20 md:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-reveal>
          <Eyebrow>IA no centro do atendimento</Eyebrow>
          <SectionTitle>Score de IA em cada lead. Você sabe onde está o dinheiro.</SectionTitle>
          <p className="mt-6 text-[17px] leading-relaxed text-[#57534E]">
            A inteligência artificial analisa as interações, o perfil e o momento de compra de cada cliente e
            transforma tudo numa nota de 0 a 100. A IA não substitui o corretor — ela tira o achismo da sua agenda.
          </p>
          <ul data-reveal-stagger="80" data-reveal-delay="150" className="mt-8 space-y-4">
            <CheckItem title="Prioridade do dia:">os leads mais quentes aparecem primeiro.</CheckItem>
            <CheckItem title="Motivos claros:">a IA explica por que deu aquela nota.</CheckItem>
            <CheckItem title="Histórico completo:">toda ligação, visita e mensagem numa linha do tempo.</CheckItem>
          </ul>
        </div>
        <LeadScoreMockup />
      </Container>
    </section>
  )
}
