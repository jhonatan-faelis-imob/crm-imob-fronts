import api from '@/lib/api'
import type { MessageTemplate, MessageTemplateType } from '@/types'

export interface MessageTemplateDto {
  name: string
  type: MessageTemplateType
  content: string
  isPublic?: boolean
}

export interface RenderedMessage {
  text: string
  missing: string[]
}

export const messageTemplatesService = {
  findAll: async (): Promise<MessageTemplate[]> => {
    const { data } = await api.get('/message-templates')
    return data
  },
  create: async (dto: MessageTemplateDto): Promise<MessageTemplate> => {
    const { data } = await api.post('/message-templates', dto)
    return data
  },
  update: async (id: string, dto: MessageTemplateDto): Promise<MessageTemplate> => {
    const { data } = await api.patch(`/message-templates/${id}`, dto)
    return data
  },
  remove: async (id: string) => {
    await api.delete(`/message-templates/${id}`)
  },
  render: async (id: string, leadId: string): Promise<RenderedMessage> => {
    const { data } = await api.post(`/message-templates/${id}/render`, { leadId })
    return data
  },
  renderFree: async (leadId: string, text: string): Promise<RenderedMessage> => {
    const { data } = await api.post('/message-templates/render-free', { leadId, text })
    return data
  },
  sendLog: async (id: string, leadId: string, text: string) => {
    await api.post(`/message-templates/${id}/send-log`, { leadId, text })
  },
  sendLogFree: async (leadId: string, text: string) => {
    await api.post('/message-templates/send-log-free', { leadId, text })
  },
}
