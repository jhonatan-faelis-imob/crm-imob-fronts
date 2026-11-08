import { ArrowDown, Check, MessageCircle } from 'lucide-react'
import { Container, Eyebrow, MockupFrame, SectionTitle } from './ui'

// Ilustração (não é botão real). #1E8549 em vez de #1F8A4C: o token dá 4,38:1 com branco, abaixo de 4,5:1
function WhatsappChip() {
  return (
    <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#1E8549] px-3 text-[13px] font-bold text-white">
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      WhatsApp
    </span>
  )
}

function TasksMockup() {
  return (
    <MockupFrame>
      <figure>
        <figcaption className="sr-only">Exemplo da lista de tarefas de hoje com follow-up encadeado.</figcaption>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[16px] font-bold">Tarefas de hoje</p>
          <span className="rounded-full bg-[#FFE4EA] px-2.5 py-1 text-[12px] font-bold text-[#B00D40]">6 pendentes</span>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-[14px] border border-[#E6E2DD] p-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1C1B1A]">
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[#6B6762] line-through">Ligar para Pedro Alves</p>
            <p className="text-[13px] text-[#6B6762]">Concluída · 09h40</p>
          </div>
        </div>

        <p className="flex items-center gap-1.5 py-3 pl-4 text-[13px] font-semibold text-[#C8104A]">
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
          Próxima tarefa criada automaticamente
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border-2 border-[#FF385C] p-4">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">Enviar proposta para Pedro Alves</p>
            <p className="text-[13px] text-[#57534E]">Hoje · 16h</p>
          </div>
          <WhatsappChip />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#E6E2DD] p-4">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">Confirmar visita de Ana Ribeiro</p>
            <p className="text-[13px] text-[#57534E]">Amanhã · 10h</p>
          </div>
          <WhatsappChip />
        </div>
      </figure>
    </MockupFrame>
  )
}

export function FollowUp() {
  return (
    <section className="bg-white py-20 md:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="lg:order-2">
          <Eyebrow>Follow-up sem esforço</Eyebrow>
          <SectionTitle>O cliente não some porque você esqueceu de ligar.</SectionTitle>
          <p className="mt-6 text-[17px] leading-relaxed text-[#57534E]">
            Tarefas encadeadas montam a cadência de atendimento por você: concluiu uma, a próxima entra na agenda.
            Lista ou calendário, com um toque para abrir a conversa no WhatsApp direto da tarefa.
          </p>
        </div>
        <div className="lg:order-1">
          <TasksMockup />
        </div>
      </Container>
    </section>
  )
}
