import Link from 'next/link'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-6 ${className}`}>{children}</div>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#C8104A]">{children}</p>
}

export function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`mt-3 text-[clamp(32px,4vw,48px)] font-extrabold leading-[1.1] tracking-[-0.03em] ${className}`}
    >
      {children}
    </h2>
  )
}

type ButtonVariant = 'primary' | 'outline-dark-bg' | 'outline-light-bg' | 'outline-on-featured'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-[#E31C5F] text-white hover:bg-[#C8104A]',
  'outline-dark-bg': 'border border-[#4A4A4A] text-white hover:bg-white/10',
  'outline-light-bg': 'border border-[#1C1B1A] text-[#1C1B1A] hover:bg-[#1C1B1A] hover:text-white',
  'outline-on-featured': 'border border-white/40 text-white hover:bg-white/10',
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string
  children: ReactNode
  variant?: ButtonVariant
  className?: string
}) {
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] px-6 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF385C] ${VARIANTS[variant]} ${className}`
  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}

export function CheckItem({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFE4EA]">
        <Check className="h-3.5 w-3.5 text-[#C8104A]" strokeWidth={3} aria-hidden="true" />
      </span>
      <p className="text-[16px] leading-relaxed text-[#57534E]">
        <strong className="font-semibold text-[#1C1B1A]">{title}</strong> {children}
      </p>
    </li>
  )
}

export function ScoreBadge({ score }: { score: number }) {
  const hot = score >= 70
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
        hot ? 'bg-[#FFE4EA] text-[#B00D40]' : 'bg-[#F1EEEA] text-[#57534E]'
      }`}
    >
      IA {score}
    </span>
  )
}

export function MockupFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] border border-[#E6E2DD] bg-white p-5 shadow-[0_24px_60px_-24px_rgba(28,27,26,0.25)] sm:p-6 ${className}`}
    >
      {children}
    </div>
  )
}
