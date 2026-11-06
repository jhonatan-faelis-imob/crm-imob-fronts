import type { GoalScope } from '@/types'
import type { ApiGoalSummary } from './api'

export interface GoalSummary {
  id: string
  label: string
  target: number
  realized: number
  scope: GoalScope
  type: string
  pace?: ApiGoalSummary['pace']
}

export interface RankingEntry {
  id: string
  name: string
  vgv: number
  units: number
  goalPct: number | null
  isCurrentUser?: boolean
}
