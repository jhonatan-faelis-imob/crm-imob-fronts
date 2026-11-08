import { Plus } from 'lucide-react'
import { FAQ } from '@/lib/landing/faq'
import { Container, Eyebrow, SectionTitle } from './ui'

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-[72px] bg-white py-20 md:py-28">
      <Container className="max-w-[860px]">
        <div data-reveal className="text-center">
          <Eyebrow>Perguntas frequentes</Eyebrow>
          <SectionTitle>Ficou alguma dúvida?</SectionTitle>
        </div>
        <div data-reveal-stagger="60" className="mt-12 divide-y divide-[#E6E2DD] border-y border-[#E6E2DD]">
          {FAQ.map((item, index) => (
            <details key={item.question} open={index === 0} data-stagger-item className="lp-faq group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF385C] [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus
                  className="lp-faq-icon h-5 w-5 shrink-0 text-[#C8104A] transition-transform duration-200 group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-6 pr-9 text-[16px] leading-relaxed text-[#57534E]">
                {item.answer}
                {item.link && (
                  <>
                    {' '}
                    <a href={item.link.href} className="font-semibold text-[#C8104A] underline underline-offset-2">
                      {item.link.label}
                    </a>
                    .
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}
