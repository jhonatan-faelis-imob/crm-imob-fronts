'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems } from './sidebar'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between rounded-[16px] border-[0.5px] border-neutral-200 bg-white px-1 py-1 lg:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="flex flex-1 items-center justify-center py-2.5"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isActive ? 'bg-brand-bg' : ''
              }`}
            >
              <Icon
                size={22}
                strokeWidth={2}
                className={isActive ? 'text-brand' : 'text-neutral-400'}
              />
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
