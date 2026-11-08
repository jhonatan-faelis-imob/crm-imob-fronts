'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  LayoutDashboard,
  CalendarCheck,
  Users,
  CheckSquare,
  Building2,
  Calculator,
  Target,
  BarChart2,
  ChevronDown,
  LogOut,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MyDayBadge } from '@/features/meu-dia/components/my-day-badge'
import { useHydrated } from '@/lib/use-hydrated'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { isNavItemActive, useSettingsGroup, visibleSettingsItems } from './settings-nav'

export const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/meu-dia', label: 'Meu dia', icon: CalendarCheck },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/empreendimentos', label: 'Empreendimentos', icon: Building2 },
  // Lista estática, sem filtro por cargo: todos os perfis simulam
  { href: '/simulador', label: 'Simulador', icon: Calculator },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
]

function SettingsGroup({ pathname, role, isHydrated }: { pathname: string; role?: string; isHydrated: boolean }) {
  const { isActive, isOpen, toggle } = useSettingsGroup(pathname)
  const items = visibleSettingsItems(isHydrated, role)
  if (items.length === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls="sidebar-settings"
        className={cn(
          'flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'bg-brand-bg text-brand' : 'text-neutral-600 hover:bg-neutral-100',
        )}
      >
        <Settings className="h-5 w-5" strokeWidth={2} />
        Configurações
        <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div id="sidebar-settings" className="mt-1 space-y-1 pl-5">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors',
                isNavItemActive(pathname, href) ? 'bg-brand-bg text-brand' : 'text-neutral-600 hover:bg-neutral-100',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const roleLabels: Record<string, string> = {
  diretor: 'Diretor',
  gerente: 'Gerente',
  coordenador: 'Coordenador',
  corretor: 'Corretor',
  administrativo: 'Administrativo',
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const isHydrated = useHydrated()
  // O usuário vem do localStorage: antes da montagem o HTML não pode depender dele
  const storedUser = useAuthStore((state) => state.user)
  const user = isHydrated ? storedUser : null
  const clearAuth = useAuthStore((state) => state.clearAuth)

  function handleLogout() {
    clearAuth()
    router.push('/login')
  }

  return (
    <aside className="hidden h-screen w-[240px] shrink-0 flex-col border-r-[0.5px] border-neutral-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <Home className="h-5 w-5 text-brand" strokeWidth={2.5} />
        <span className="text-[20px] font-semibold text-neutral-900">CRM Imob</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-bg text-brand' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {label}
              {href === '/meu-dia' && <MyDayBadge className="ml-auto" />}
            </Link>
          )
        })}
        <SettingsGroup pathname={pathname} role={user?.role} isHydrated={isHydrated} />
      </nav>

      <div className="flex items-center gap-2 border-t-[0.5px] border-neutral-200 px-4 py-4">
        <Avatar>
          <AvatarFallback className="bg-brand-bg text-brand">
            {getInitials(user?.name ?? '')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900">{user?.name}</p>
          <p className="truncate text-xs text-neutral-400">
            {user ? (roleLabels[user.role] ?? user.role) : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-neutral-400 transition-colors hover:bg-danger-bg hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
