import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Marca discreta das tarefas criadas pela cadência da etapa
export function AutoTaskChip({ className }: { className?: string }) {
  return (
    <span
      title="Criada automaticamente pela cadência da etapa"
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600',
        className,
      )}
    >
      <Zap className="h-3 w-3" />
      Automática
    </span>
  )
}
