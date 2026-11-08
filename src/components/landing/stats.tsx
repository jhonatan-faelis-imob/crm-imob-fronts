import { CountUp } from './count-up'
import { Container } from './ui'

// count: o número conta a partir de 0; sem count, o valor entra com fade e scale
const STATS: { value: string; count?: number; label: string }[] = [
  { value: '5', count: 5, label: 'níveis de acesso, do diretor ao administrativo' },
  { value: '3', count: 3, label: 'camadas de meta: imobiliária, equipe e corretor' },
  { value: '0–100', label: 'score de IA para priorizar cada lead' },
  { value: '1 toque', label: 'da tarefa até a conversa no WhatsApp' },
]
const STAGGER = 100

export function Stats() {
  return (
    <section className="bg-[#121212] py-16 text-white md:py-20" aria-label="O CRM Imob em números">
      <Container>
        <ul data-reveal-stagger={STAGGER} className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <li key={stat.value} data-stagger-item={stat.count === undefined ? 'scale' : 'fade'}>
              <p className="text-[56px] font-extrabold leading-none tracking-[-0.03em] text-[#FF385C]">
                {stat.count === undefined ? stat.value : <CountUp value={stat.count} delay={index * STAGGER} duration={700} />}
              </p>
              <p className="mt-3 text-[16px] leading-relaxed text-[#BDB9B4]">{stat.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
