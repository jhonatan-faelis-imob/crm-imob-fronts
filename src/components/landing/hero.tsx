import { ArrowRight } from 'lucide-react'
import { LINKS } from '@/lib/landing/links'
import { KanbanMockup } from './kanban-mockup'
import { motionVars } from './motion-vars'
import { ButtonLink, Container } from './ui'

export function Hero() {
  return (
    <section data-hero className="bg-[#121212] pb-20 pt-16 text-white md:pb-28 md:pt-24">
      <Container className="text-center">
        <p
          data-hero-seq
          style={motionVars({ d: 0 })}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-[13px] font-medium text-[#BDB9B4] sm:text-[14px]">
          <span className="lp-pulse h-2 w-2 shrink-0 rounded-full bg-[#FF385C]" aria-hidden="true" />
          CRM imobiliário com IA para lançamento e revenda
        </p>
        <h1
          data-hero-seq
          style={motionVars({ d: 80 })}
          className="mx-auto mt-6 max-w-[920px] text-[clamp(40px,6vw,76px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
          O CRM que não deixa seu cliente <span data-hero-seq="word" style={motionVars({ d: 560 })} className="lp-word text-[#FF385C]">
            esfriar.
          </span>
        </h1>
        {/* Elemento de LCP no celular: sobe sem fade, para a animação não atrasar o LCP */}
        <p
          data-hero-seq="move"
          style={motionVars({ d: 160 })}
          className="mx-auto mt-6 max-w-[720px] text-[17px] leading-relaxed text-[#BDB9B4] sm:text-[19px]">
          Funil, follow-up, tarefas e metas num só lugar — com uma IA que pontua cada lead e mostra em quem investir
          seu tempo hoje. Feito para corretores e equipes que vivem de lançamento e revenda.
        </p>
        <div data-hero-seq style={motionVars({ d: 240 })} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={LINKS.signup}>
            Começar teste grátis
            <ArrowRight className="lp-arrow h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href={LINKS.sales} variant="outline-dark-bg">
            Agendar demonstração
          </ButtonLink>
        </div>
        <p data-hero-seq style={motionVars({ d: 320 })} className="mt-5 text-[14px] text-[#BDB9B4]">
          Acesso pelo navegador e pelo celular · Dados de cada imobiliária isolados
        </p>
        <div data-hero-seq="tilt" style={motionVars({ d: 480 })} className="mx-auto mt-14 max-w-[1100px] md:mt-16">
          <KanbanMockup />
        </div>
      </Container>
    </section>
  )
}
