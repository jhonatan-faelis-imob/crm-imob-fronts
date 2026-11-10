'use client'

import { Check, Copy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from '@/components/ui/toast'
import { useIsMobile } from '@/lib/use-is-mobile'
import { cn } from '@/lib/utils'
import type { IntegrationStatus } from '@/services/integrations.service'
import { STATUS_META } from '../constants'

// Sheet lateral no desktop, tela cheia no celular
export function PanelShell({
  open,
  onOpenChange,
  title,
  description,
  status,
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  status?: IntegrationStatus
  children: ReactNode
  footer?: ReactNode
}) {
  const isMobile = useIsMobile()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'gap-0 bg-white p-0',
          isMobile ? 'h-[100dvh] max-h-[100dvh]' : 'w-full sm:max-w-lg',
        )}
      >
        <SheetHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="text-lg font-semibold text-neutral-900">{title}</SheetTitle>
            {status && <StatusBadge status={status} />}
          </div>
          <SheetDescription className="text-sm text-neutral-400">{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t-[0.5px] border-neutral-200 p-4 sm:flex-row sm:justify-end sm:p-6">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function StatusBadge({ status }: { status: IntegrationStatus }) {
  const meta = STATUS_META[status]
  return <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', meta.className)}>{meta.label}</span>
}

export function Step({ number, title, children, muted = false }: { number: number; title: string; children: ReactNode; muted?: boolean }) {
  return (
    <section className={cn('space-y-3', muted && 'opacity-50')}>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-bg text-xs font-semibold text-brand">
          {number}
        </span>
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="space-y-3 pl-8">{children}</div>
    </section>
  )
}

export function CopyButton({ getValue, label }: { getValue: () => string | Promise<string>; label: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(await getValue())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.add({ title: 'Não foi possível copiar', type: 'error' })
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border-[1.5px] border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100"
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'danger'; children: ReactNode }) {
  return (
    <p
      className={cn(
        'rounded-[12px] p-3 text-xs leading-relaxed',
        tone === 'info' && 'bg-neutral-100 text-neutral-600',
        tone === 'warning' && 'bg-[#FFF7E0] text-[#B45309]',
        tone === 'danger' && 'bg-danger-bg text-danger',
      )}
    >
      {children}
    </p>
  )
}
