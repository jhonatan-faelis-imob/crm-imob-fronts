import { Trophy } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, getInitials } from '@/lib/utils'
import { ProgressBar } from './progress-bar'
import type { RankingEntry } from './types'

export function RankingSection({ entries }: { entries: RankingEntry[] }) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-line bg-paper p-5 lg:p-6">
      <h2 className="text-[20px] font-semibold text-brand">Ranking do mês</h2>

      <ul className="mt-4 space-y-2">
        {entries.map((entry, index) => {
          const position = index + 1
          return (
            <li
              key={entry.id}
              className={`rounded-[12px] p-3 ${entry.isCurrentUser ? 'bg-canvas' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-sm font-medium text-muted-foreground">
                  {position}º
                </span>
                <Avatar>
                  <AvatarFallback className="bg-line text-brand">
                    {getInitials(entry.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-brand">
                      {entry.name}
                    </span>
                    {position === 1 && entry.vgv > 0 && <Trophy className="h-4 w-4 shrink-0 text-amber-500" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{entry.units} unidades</span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-brand">
                    {formatCurrency(entry.vgv)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.goalPct === null ? 'Sem meta' : `${entry.goalPct}% da meta`}
                  </p>
                </div>
              </div>
              {entry.goalPct !== null && (
                <div className="mt-2 pl-8">
                  <ProgressBar value={entry.goalPct} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
