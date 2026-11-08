import { Container, Eyebrow, SectionTitle } from './ui'

const AUDIENCES = [
  {
    label: 'Corretor',
    title: 'Sua carteira organizada',
    text: 'Pare de perder cliente por falta de retorno. Seus leads, suas tarefas e sua meta numa tela só.',
  },
  {
    label: 'Equipes de lançamento',
    title: 'Ritmo de plantão',
    text: 'Volume alto de leads, distribuição por equipe e o coordenador vendo o funil do time em tempo real.',
  },
  {
    label: 'Imobiliárias de revenda',
    title: 'Gestão de ponta a ponta',
    text: 'Catálogo de imóveis, vendas com histórico e relatórios para a diretoria decidir com número.',
  },
]

export function Audience() {
  return (
    <section className="bg-white py-20 md:py-28">
      <Container>
        <div data-reveal className="max-w-[760px]">
          <Eyebrow>Para quem é</Eyebrow>
          <SectionTitle>Do corretor autônomo à imobiliária com várias equipes.</SectionTitle>
        </div>
        <ul data-reveal-stagger="90" className="mt-12 grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((item) => (
            <li key={item.label} data-stagger-item className="lp-lift rounded-[16px] bg-[#F7F5F3] p-7">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#C8104A]">{item.label}</p>
              <h3 className="mt-3 text-[22px] font-extrabold tracking-[-0.02em]">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#57534E]">{item.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
