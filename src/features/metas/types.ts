import type { GoalScope } from '@/types'

export interface GoalSummary {
  id: string
  label: string
  target: number
  realized: number
  scope: GoalScope
}

export interface RankingEntry {
  id: string
  name: string
  vgv: number
  units: number
  goalPct: number
  isCurrentUser?: boolean
}
