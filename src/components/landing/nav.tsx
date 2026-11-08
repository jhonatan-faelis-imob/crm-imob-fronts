import Link from 'next/link'
import { LINKS, SECTION_LINKS } from '@/lib/landing/links'
import { Logo } from './logo'
import { NavMobileMenu } from './nav-mobile-menu'
import { ButtonLink, Container } from './ui'

// O fundo #121212 fica em .lp-nav::before (motion.css), para a troca por blur animar só opacity
export function Nav() {
  return (
    <header className="lp-nav sticky top-0 z-50 border-b border-white/10">
      <Container className="flex h-[72px] items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Seções" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {SECTION_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="lp-navlink text-[15px] font-medium text-[#BDB9B4] transition-colors hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-5 md:flex">
          <Link href={LINKS.login} className="text-[15px] font-semibold text-white hover:text-[#FF385C]">
            Entrar
          </Link>
          <ButtonLink href={LINKS.signup} className="min-h-11 px-5">
            Teste grátis
          </ButtonLink>
        </div>
        <NavMobileMenu />
      </Container>
    </header>
  )
}
