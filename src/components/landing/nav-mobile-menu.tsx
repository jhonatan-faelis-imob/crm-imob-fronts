'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LINKS, SECTION_LINKS } from '@/lib/landing/links'

export function NavMobileMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="landing-mobile-menu"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        className="flex h-11 w-11 items-center justify-center rounded-[12px] text-white hover:bg-white/10"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
      </button>
      <div
        id="landing-mobile-menu"
        hidden={!open}
        className="absolute inset-x-0 top-[72px] border-b border-white/10 bg-[#121212] px-6 pb-6 pt-2"
      >
        <nav aria-label="Seções no celular">
          <ul className="flex flex-col">
            {SECTION_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={close}
                  className="block border-b border-white/10 py-4 text-[16px] font-medium text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-5 flex flex-col gap-3">
          <Link
            href={LINKS.signup}
            onClick={close}
            className="flex min-h-12 items-center justify-center rounded-[12px] bg-[#E31C5F] text-[15px] font-semibold text-white hover:bg-[#C8104A]"
          >
            Teste grátis
          </Link>
          <Link
            href={LINKS.login}
            onClick={close}
            className="flex min-h-12 items-center justify-center rounded-[12px] border border-[#4A4A4A] text-[15px] font-semibold text-white"
          >
            Entrar
          </Link>
        </div>
      </div>
    </div>
  )
}
