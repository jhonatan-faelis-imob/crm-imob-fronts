import { LINKS } from '@/lib/landing/links'
import { motionVars } from './motion-vars'
import { ButtonLink, Container } from './ui'

export function FinalCta() {
  return (
    <section className="bg-white pb-20 md:pb-28">
      <Container>
        <div data-reveal="scale" className="rounded-[28px] bg-[#121212] px-6 py-16 text-center text-white sm:px-12 md:py-20">
          <h2 className="mx-auto max-w-[820px] text-[clamp(32px,4vw,48px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            Seu próximo cliente já está no funil. {/* Só opacity: a frase quebra linha, então não recebe transform */}
            <span style={motionVars({ d: 150, anim: 'lp-fade', dur: 700 })} className="lp-in text-[#FF385C]">
              Não deixe ele esfriar.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-[#BDB9B4]">
            Comece hoje e veja seus leads organizados ainda nesta semana.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={LINKS.signup}>Começar teste grátis</ButtonLink>
            <ButtonLink href={LINKS.sales} variant="outline-dark-bg">
              Agendar demonstração
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
