'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from '@/components/ui/toast'
import { documentsService, type ChecklistItemDto, type ChecklistItemUpdate } from '@/services/documents.service'
import type { ChecklistItem, ChecklistStatus, LeadChecklist } from '@/types'
import { invalidateDocumentQueries, summarizeItems } from './constants'

function apiMessage(error: unknown) {
  const message = isAxiosError(error) ? error.response?.data?.message : undefined
  return typeof message === 'string' ? message : undefined
}

// enabled: o GET gera o checklist, então só roda quando a aba abre (ou no "Iniciar")
export function useLeadChecklist(leadId: string, enabled: boolean) {
  const queryClient = useQueryClient()
  const queryKey = ['lead-docs', leadId]

  const query = useQuery({
    queryKey,
    queryFn: () => documentsService.getChecklist(leadId),
    enabled,
  })

  // Aplica a mudança na hora; se o servidor recusar, volta ao que estava
  async function patchItems(patch: (item: ChecklistItem) => ChecklistItem) {
    await queryClient.cancelQueries({ queryKey })
    const previous = queryClient.getQueryData<LeadChecklist>(queryKey)
    if (previous) {
      const items = previous.items.map(patch)
      queryClient.setQueryData<LeadChecklist>(queryKey, { items, summary: summarizeItems(items) })
    }
    return { previous }
  }

  function rollback(context: { previous: LeadChecklist | undefined } | undefined) {
    if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
  }

  const settle = () => invalidateDocumentQueries(queryClient, leadId)

  const updateItem = useMutation({
    mutationFn: ({ id, change }: { id: string; change: ChecklistItemUpdate }) => documentsService.updateItem(id, change),
    onMutate: ({ id, change }) =>
      patchItems((item) =>
        item.id === id
          ? {
              ...item,
              ...(change.status && { status: change.status }),
              ...(change.notes !== undefined && { notes: change.notes.trim() || null }),
              ...(change.name !== undefined && { name: change.name }),
            }
          : item,
      ),
    onError: (error, _variables, context) => {
      rollback(context)
      toast.add({ title: 'Não foi possível alterar o documento', description: apiMessage(error), type: 'error' })
    },
    onSettled: settle,
  })

  const bulkUpdate = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ChecklistStatus }) =>
      documentsService.bulkUpdate(leadId, ids, status),
    onMutate: ({ ids, status }) => {
      const selected = new Set(ids)
      return patchItems((item) => (selected.has(item.id) ? { ...item, status } : item))
    },
    onSuccess: (_data, { ids }) =>
      toast.add({ title: `${ids.length} ${ids.length === 1 ? 'documento atualizado' : 'documentos atualizados'}`, type: 'success' }),
    onError: (error, _variables, context) => {
      rollback(context)
      toast.add({ title: 'Não foi possível atualizar os documentos', description: apiMessage(error), type: 'error' })
    },
    onSettled: settle,
  })

  const addItem = useMutation({
    mutationFn: (dto: ChecklistItemDto) => documentsService.addItem(leadId, dto),
    onSuccess: () => toast.add({ title: 'Documento adicionado', type: 'success' }),
    onError: (error) =>
      toast.add({ title: 'Não foi possível adicionar o documento', description: apiMessage(error), type: 'error' }),
    onSettled: settle,
  })

  const removeItem = useMutation({
    mutationFn: (id: string) => documentsService.removeItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<LeadChecklist>(queryKey)
      if (previous) {
        const items = previous.items.filter((item) => item.id !== id)
        queryClient.setQueryData<LeadChecklist>(queryKey, { items, summary: summarizeItems(items) })
      }
      return { previous }
    },
    onSuccess: () => toast.add({ title: 'Documento excluído', type: 'success' }),
    onError: (error, _id, context) => {
      rollback(context)
      toast.add({ title: 'Não foi possível excluir o documento', description: apiMessage(error), type: 'error' })
    },
    onSettled: settle,
  })

  const sync = useMutation({
    mutationFn: () => documentsService.syncChecklist(leadId),
    onSuccess: ({ created }) =>
      toast.add({
        title: created
          ? `${created} ${created === 1 ? 'documento novo entrou' : 'documentos novos entraram'} no checklist`
          : 'O checklist já está em dia com a lista da imobiliária',
        type: 'success',
      }),
    onError: (error) =>
      toast.add({ title: 'Não foi possível sincronizar', description: apiMessage(error), type: 'error' }),
    onSettled: settle,
  })

  return { query, updateItem, bulkUpdate, addItem, removeItem, sync }
}
