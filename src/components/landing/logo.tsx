import Link from 'next/link'
import { House } from 'lucide-react'

export function Logo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Smart CRM, página inicial">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FF385C]">
        <House className="h-5 w-5 text-white" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className={`text-[18px] font-extrabold tracking-[-0.02em] ${tone === 'light' ? 'text-white' : 'text-[#1C1B1A]'}`}>
        Smart CRM
      </span>
    </Link>
  )
}
