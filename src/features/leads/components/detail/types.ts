import type { LeadStatus, TaskType } from '@/types'

export type TimelineEntry =
  | {
      kind: 'interaction'
      id: string
      type: TaskType
      userName: string
      notes: string
      occurredAt: string
    }
  | {
      kind: 'stage_change'
      id: string
      fromStatus: LeadStatus
      toStatus: LeadStatus
      userName: string
      occurredAt: string
    }
