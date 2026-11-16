'use client'

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import { usersService, type TransferKind, type TransferResult } from '@/services/users.service'
import { apiErrorMessage, isSeatLimitError } from './api'

/** Depois de qualquer ação sobre um membro: pessoas, equipes, carteira (leads, tarefas, Meu dia) e assentos */
export function invalidateMemberChanges(queryClient: QueryClient) {
  for (const key of ['users', 'teams', 'team', 'leads', 'tasks', 'my-day', 'billing-me']) {
    queryClient.invalidateQueries({ queryKey: [key] })
  }
}

export function transferSummary(moved: TransferResult): string {
  const parts: string[] = []
  if (moved.leads > 0) parts.push(`${moved.leads} ${moved.leads === 1 ? 'lead' : 'leads'}`)
  if (moved.tasks > 0) parts.push(`${moved.tasks} ${moved.tasks === 1 ? 'tarefa' : 'tarefas'}`)
  if (moved.properties > 0) parts.push(`${moved.properties} ${moved.properties === 1 ? 'imóvel' : 'imóveis'}`)
  return parts.length > 0 ? parts.join(', ') : 'nada para mover'
}

export interface DeactivateInput {
  id: string
  name: string
  reason?: string
  transfer?: { toUserId: string; toName: string; what: TransferKind[] }
}

type DeactivateResult = { moved: TransferResult | null; transferFailed: boolean }

/** Desativar, reativar e transferir, com toast da mensagem do backend */
export function useMemberActions() {
  const queryClient = useQueryClient()

  const deactivate = useMutation({
    // Desativa primeiro: se o backend recusar (último diretor, coordenador de equipe), nada foi transferido
    mutationFn: async ({ id, reason, transfer }: DeactivateInput): Promise<DeactivateResult> => {
      await usersService.deactivate(id, reason)
      if (!transfer) return { moved: null, transferFailed: false }
      try {
        const moved = await usersService.transfer(id, { toUserId: transfer.toUserId, what: transfer.what })
        return { moved, transferFailed: false }
      } catch {
        return { moved: null, transferFailed: true }
      }
    },
    onSuccess: (result, { name, transfer }) => {
      if (result.transferFailed) {
        toast.add({
          title: `${name} foi desativado, mas a transferência falhou`,
          description: 'Use "Transferir carteira" na seção Inativos para tentar de novo.',
          type: 'error',
        })
      } else if (result.moved && transfer) {
        toast.add({
          title: `${name} desativado`,
          description: `Transferido para ${transfer.toName}: ${transferSummary(result.moved)}. O assento está livre.`,
          type: 'success',
        })
      } else {
        toast.add({ title: `${name} desativado`, description: 'O assento voltou a ficar livre no plano.', type: 'success' })
      }
    },
    onError: (error) => {
      toast.add({
        title: 'Não foi possível desativar',
        description: apiErrorMessage(error, 'Tente de novo em instantes.'),
        type: 'error',
      })
    },
    onSettled: () => invalidateMemberChanges(queryClient),
  })

  const activate = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => usersService.activate(id),
    onSuccess: (_data, { name }) => toast.add({ title: `${name} reativado`, type: 'success' }),
    onError: (error) => {
      // 402 de plano cheio: o interceptor já abre o aviso de limite
      if (isSeatLimitError(error)) return
      toast.add({
        title: 'Não foi possível reativar',
        description: apiErrorMessage(error, 'Tente de novo em instantes.'),
        type: 'error',
      })
    },
    onSettled: () => invalidateMemberChanges(queryClient),
  })

  const transfer = useMutation({
    mutationFn: ({ id, toUserId, what }: { id: string; toUserId: string; toName: string; what: TransferKind[] }) =>
      usersService.transfer(id, { toUserId, what }),
    onSuccess: (moved, { toName }) =>
      toast.add({ title: `Carteira transferida para ${toName}`, description: transferSummary(moved), type: 'success' }),
    onError: (error) => {
      toast.add({
        title: 'Não foi possível transferir',
        description: apiErrorMessage(error, 'Tente de novo em instantes.'),
        type: 'error',
      })
    },
    onSettled: () => invalidateMemberChanges(queryClient),
  })

  return { deactivate, activate, transfer }
}
