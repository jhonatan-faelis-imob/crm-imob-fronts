import { Container } from './ui'

const STATS = [
  { value: '5', label: 'níveis de acesso, do diretor ao administrativo' },
  { value: '3', label: 'camadas de meta: imobiliária, equipe e corretor' },
  { value: '0–100', label: 'score de IA para priorizar cada lead' },
  { value: '1 toque', label: 'da tarefa até a conversa no WhatsApp' },
]

export function Stats() {
  return (
    <section className="bg-[#121212] py-16 text-white md:py-20" aria-label="O CRM Imob em números">
      <Container>
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <li key={stat.value}>
              <p className="text-[56px] font-extrabold leading-none tracking-[-0.03em] text-[#FF385C]">{stat.value}</p>
              <p className="mt-3 text-[16px] leading-relaxed text-[#BDB9B4]">{stat.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
