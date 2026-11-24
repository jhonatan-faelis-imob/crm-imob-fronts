import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border-[0.5px] border-line bg-paper px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-line text-brand">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[16px] font-semibold text-brand">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
