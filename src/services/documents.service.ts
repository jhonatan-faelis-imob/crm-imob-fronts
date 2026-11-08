import api from '@/lib/api'
import type {
  ChecklistItem,
  ChecklistStatus,
  DocumentAppliesWhen,
  DocumentCategory,
  DocumentHolder,
  DocumentRequirement,
  LeadChecklist,
} from '@/types'

export interface RequirementDto {
  name: string
  description?: string
  category: DocumentCategory
  holder: DocumentHolder
  required: boolean
  appliesWhen: DocumentAppliesWhen
  active?: boolean
}

export interface ChecklistItemDto {
  name: string
  description?: string
  category?: DocumentCategory
  holder?: DocumentHolder
  required?: boolean
}

export interface ChecklistItemUpdate {
  status?: ChecklistStatus
  notes?: string
  name?: string
}

export const documentsService = {
  listRequirements: async (): Promise<DocumentRequirement[]> => {
    const { data } = await api.get<DocumentRequirement[]>('/documents/requirements')
    return data
  },
  createRequirement: async (dto: RequirementDto): Promise<DocumentRequirement> => {
    const { data } = await api.post<DocumentRequirement>('/documents/requirements', dto)
    return data
  },
  updateRequirement: async (id: string, dto: Partial<RequirementDto>): Promise<DocumentRequirement> => {
    const { data } = await api.patch<DocumentRequirement>(`/documents/requirements/${id}`, dto)
    return data
  },
  // O backend só desativa (active = false)
  removeRequirement: async (id: string): Promise<DocumentRequirement> => {
    const { data } = await api.delete<DocumentRequirement>(`/documents/requirements/${id}`)
    return data
  },
  reorderRequirements: async (orderedIds: string[]): Promise<DocumentRequirement[]> => {
    const { data } = await api.patch<DocumentRequirement[]>('/documents/requirements/reorder', { orderedIds })
    return data
  },
  getChecklist: async (leadId: string): Promise<LeadChecklist> => {
    const { data } = await api.get<LeadChecklist>(`/documents/lead/${leadId}`)
    return data
  },
  syncChecklist: async (leadId: string): Promise<{ created: number }> => {
    const { data } = await api.post<{ created: number }>(`/documents/lead/${leadId}/sync`)
    return data
  },
  addItem: async (leadId: string, dto: ChecklistItemDto): Promise<ChecklistItem> => {
    const { data } = await api.post<ChecklistItem>(`/documents/lead/${leadId}/items`, dto)
    return data
  },
  updateItem: async (id: string, dto: ChecklistItemUpdate): Promise<ChecklistItem> => {
    const { data } = await api.patch<ChecklistItem>(`/documents/items/${id}`, dto)
    return data
  },
  bulkUpdate: async (leadId: string, ids: string[], status: ChecklistStatus): Promise<LeadChecklist> => {
    const { data } = await api.post<LeadChecklist>(`/documents/lead/${leadId}/bulk`, { ids, status })
    return data
  },
  removeItem: async (id: string) => {
    await api.delete(`/documents/items/${id}`)
  },
}
