import type { ApiProperty } from '@/features/empreendimentos/api'
import { mapApiPropertyToProperty } from '@/features/empreendimentos/api'
import type { Interaction, Property, TaskType } from '@/types'
import type { TimelineEntry } from './types'

export interface ApiInteraction {
  id: string
  organizationId: string
  leadId: string
  userId: string
  type: string
  notes: string
  occurredAt: string
  createdAt: string
  user?: { id: string; name: string; avatarUrl: string | null } | null
}

export function mapApiInteractionToInteraction(interaction: ApiInteraction): Interaction {
  return {
    id: interaction.id,
    organizationId: interaction.organizationId,
    leadId: interaction.leadId,
    userId: interaction.userId,
    userName: interaction.user?.name ?? 'Sistema',
    type: interaction.type as TaskType,
    notes: interaction.notes,
    occurredAt: interaction.occurredAt,
    createdAt: interaction.createdAt,
  }
}

export function interactionToTimelineEntry(interaction: Interaction): TimelineEntry {
  return {
    kind: 'interaction',
    id: interaction.id,
    type: interaction.type,
    userName: interaction.userName,
    notes: interaction.notes,
    occurredAt: interaction.occurredAt,
  }
}

export interface ApiLeadProperty {
  id: string
  propertyId: string
  notes: string | null
  property: ApiProperty
}

export function mapApiLeadPropertiesToProperties(items: ApiLeadProperty[]): Property[] {
  return items.map((item) => mapApiPropertyToProperty(item.property))
}
