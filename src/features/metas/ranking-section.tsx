import { Trophy } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, getInitials } from '@/lib/utils'
import { ProgressBar } from './progress-bar'
import type { RankingEntry } from './types'

export function RankingSection({ entries }: { entries: RankingEntry[] }) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <h2 className="text-[20px] font-semibold text-neutral-900">Ranking do mês</h2>

      <ul className="mt-4 space-y-2">
        {entries.map((entry, index) => {
          const position = index + 1
          return (
            <li
              key={entry.id}
              className={`rounded-[12px] p-3 ${entry.isCurrentUser ? 'bg-neutral-100' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-sm font-medium text-neutral-400">
                  {position}º
                </span>
                <Avatar>
                  <AvatarFallback className="bg-brand-bg text-brand">
                    {getInitials(entry.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-neutral-900">
                      {entry.name}
                    </span>
                    {position === 1 && <Trophy className="h-4 w-4 shrink-0 text-amber-500" />}
                  </div>
                  <span className="text-xs text-neutral-400">{entry.units} unidades</span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(entry.vgv)}
                  </p>
                  <p className="text-xs text-neutral-400">{entry.goalPct}% da meta</p>
                </div>
              </div>
              <div className="mt-2 pl-8">
                <ProgressBar value={entry.goalPct} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
