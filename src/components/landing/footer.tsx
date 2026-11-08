import { COMPANY } from '@/lib/landing/company'
import { LINKS } from '@/lib/landing/links'
import { Logo } from './logo'
import { Container } from './ui'

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Produto',
    links: [
      { label: 'Funcionalidades', href: '#produto' },
      { label: 'IA', href: '#ia' },
      { label: 'Metas', href: '#metas' },
      { label: 'Planos e preços', href: '#planos' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre', href: LINKS.about },
      { label: 'Contato', href: LINKS.contact },
      { label: 'Dúvidas', href: '#faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Termos de uso', href: LINKS.terms },
      { label: 'Privacidade', href: LINKS.privacy },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-[#F7F5F3] pb-10 pt-16">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-[320px]">
            <Logo tone="dark" />
            <p className="mt-4 text-[15px] leading-relaxed text-[#57534E]">
              CRM imobiliário com IA para corretores que trabalham com lançamento e revenda.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-[14px] font-bold text-[#1C1B1A]">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-[15px] text-[#57534E] hover:text-[#C8104A]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-[#E6E2DD] pt-6 text-[14px] text-[#6B6762] sm:flex-row sm:justify-between">
          <p>
            © 2026 CRM Imob · {COMPANY.legalName} · CNPJ {COMPANY.cnpj}
          </p>
          <p>
            {COMPANY.city} – {COMPANY.state}
          </p>
        </div>
      </Container>
    </footer>
  )
}
