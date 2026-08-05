'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import {
  LayoutDashboard,
  Users,
  Target,
  Plus,
  Menu as MenuIcon,
  Building2,
  UserPlus,
  CheckSquare,
  UsersRound,
  BarChart2,
  LogOut,
  X as XIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

const quickCreateItems: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  { href: '/empreendimentos', label: 'Novo Imóvel', description: 'Cadastrar empreendimento ou revenda', icon: Building2 },
  { href: '/leads', label: 'Novo Lead', description: 'Adicionar cliente ao funil', icon: UserPlus },
]

const menuNavItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/empreendimentos', label: 'Imóveis', icon: Building2 },
  { href: '/equipe', label: 'Equipe', icon: UsersRound },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
]

type ActiveSheet = 'create' | 'menu' | null

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)

  const isMenuActive = menuNavItems.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  )

  function closeSheet() {
    setActiveSheet(null)
  }

  function handleNavigate(href: string) {
    closeSheet()
    router.push(href)
  }

  function handleLogout() {
    closeSheet()
    clearAuth()
    router.push('/login')
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t-[0.5px] border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <NavLink
          href="/dashboard"
          label="Dashboard"
          icon={LayoutDashboard}
          isActive={pathname === '/dashboard' || pathname.startsWith('/dashboard/')}
        />
        <NavLink
          href="/leads"
          label="Leads"
          icon={Users}
          isActive={pathname === '/leads' || pathname.startsWith('/leads/')}
        />

        <button
          type="button"
          onClick={() => setActiveSheet('create')}
          aria-label="Criar novo"
          className="-mt-2 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[0_4px_16px_rgba(255,56,92,0.35)]"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        <NavLink
          href="/metas"
          label="Metas"
          icon={Target}
          isActive={pathname === '/metas' || pathname.startsWith('/metas/')}
        />

        <button
          type="button"
          onClick={() => setActiveSheet('menu')}
          aria-label="Menu"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5"
        >
          <MenuIcon size={22} strokeWidth={2} className={isMenuActive ? 'text-brand' : 'text-neutral-400'} />
          <span className={cn('text-[10px]', isMenuActive ? 'font-semibold text-brand' : 'text-neutral-400')}>
            Menu
          </span>
        </button>
      </nav>

      <BottomSheet open={activeSheet === 'create'} onClose={closeSheet} title="Criação rápida">
        {quickCreateItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleNavigate(item.href)}
            className="flex w-full items-center gap-3.5 border-b-[0.5px] border-[#F0F0F0] py-3.5 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand">
              <item.icon size={20} strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-neutral-900">{item.label}</span>
              <span className="block text-xs text-neutral-400">{item.description}</span>
            </span>
          </button>
        ))}
      </BottomSheet>

      <BottomSheet open={activeSheet === 'menu'} onClose={closeSheet} title="Navegação">
        <p className="px-0.5 pb-2 text-xs text-neutral-400">Navegação</p>
        {menuNavItems.map((item) => (
          <button
            key={item.href}
            type="button"
            onClick={() => handleNavigate(item.href)}
            className="flex w-full items-center gap-3.5 border-b-[0.5px] border-[#F0F0F0] py-3.5 text-left text-[15px] font-medium text-neutral-900"
          >
            <item.icon size={20} strokeWidth={2} />
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3.5 py-3.5 text-left text-[15px] font-medium text-brand"
        >
          <LogOut size={20} strokeWidth={2} />
          Sair da conta
        </button>
      </BottomSheet>
    </>
  )
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string
  label: string
  icon: LucideIcon
  isActive: boolean
}) {
  return (
    <Link href={href} aria-label={label} className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5">
      <Icon size={22} strokeWidth={2} className={isActive ? 'text-brand' : 'text-neutral-400'} />
      <span className={cn('text-[10px]', isActive ? 'font-semibold text-brand' : 'text-neutral-400')}>{label}</span>
    </Link>
  )
}

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Backdrop className="fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 lg:hidden" />
        <SheetPrimitive.Popup className="fixed inset-x-0 bottom-0 z-[101] rounded-t-[20px] bg-white px-6 pt-3 pb-8 outline-none transition-transform duration-300 ease-in-out data-ending-style:translate-y-full data-starting-style:translate-y-full lg:hidden">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-neutral-200" />
          <SheetPrimitive.Title className="sr-only">{title}</SheetPrimitive.Title>
          <SheetPrimitive.Close
            aria-label="Fechar"
            className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400"
          >
            <XIcon size={18} />
          </SheetPrimitive.Close>
          {children}
        </SheetPrimitive.Popup>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  )
}
