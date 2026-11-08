'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileCheck, Lock, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { RequirementDialog } from '@/features/documentos/components/requirement-dialog'
import { RequirementList, type RequirementActions } from '@/features/documentos/components/requirement-list'
import { DOCUMENT_HOLDERS, canManageDocuments } from '@/features/documentos/constants'
import { useHydrated } from '@/lib/use-hydrated'
import { documentsService } from '@/services/documents.service'
import { useAuthStore } from '@/store/auth.store'
import type { DocumentHolder, DocumentRequirement } from '@/types'

const QUERY_KEY = ['document-requirements']

export default function DocumentosPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isHydrated = useHydrated()
  const user = useAuthStore((state) => state.user)
  const canManage = canManageDocuments(user)

  const [dialog, setDialog] = useState<{
    requirement: DocumentRequirement | null
    holder: DocumentHolder
    session: number
  } | null>(null)
  const [deactivating, setDeactivating] = useState<DocumentRequirement | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { data: requirements, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: documentsService.listRequirements,
    enabled: isHydrated && canManage,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const setActive = useMutation({
    mutationFn: ({ requirement, active }: { requirement: DocumentRequirement; active: boolean }) =>
      active ? documentsService.updateRequirement(requirement.id, { active }) : documentsService.removeRequirement(requirement.id),
    onMutate: ({ requirement }) => setTogglingId(requirement.id),
    onSuccess: (_data, { active }) => {
      toast.add({ title: active ? 'Documento ativado' : 'Documento desativado', type: 'success' })
      setDeactivating(null)
    },
    onError: () => toast.add({ title: 'Não foi possível alterar o documento', type: 'error' }),
    onSettled: () => {
      setTogglingId(null)
      invalidate()
    },
  })

  // Otimista: a lista já aparece na nova ordem; se falhar, volta ao que o servidor tem
  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => documentsService.reorderRequirements(orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      queryClient.setQueryData<DocumentRequirement[]>(QUERY_KEY, (old) => {
        if (!old) return old
        const byId = new Map(old.map((item) => [item.id, item]))
        return orderedIds.flatMap((id, index) => {
          const item = byId.get(id)
          return item ? [{ ...item, orderIndex: index }] : []
        })
      })
    },
    onError: () => toast.add({ title: 'Não foi possível salvar a nova ordem', type: 'error' }),
    onSettled: invalidate,
  })

  if (!isHydrated) return <Skeleton className="h-64 rounded-[16px]" />

  if (!canManage) {
    return (
      <EmptyState
        icon={<Lock className="h-6 w-6" />}
        title="Acesso restrito"
        description="Só gerentes e diretores configuram a lista de documentos da imobiliária."
        action={{ label: 'Voltar para Leads', onClick: () => router.push('/leads') }}
      />
    )
  }

  const all = requirements ?? []
  const groups = DOCUMENT_HOLDERS.map((holder) => ({
    ...holder,
    items: all.filter((item) => item.holder === holder.value),
  }))

  // Reordenar um grupo manda a lista inteira, com os dois grupos em sequência
  function reorderGroup(holder: DocumentHolder, orderedIds: string[]) {
    const others = groups.filter((group) => group.value !== holder).flatMap((group) => group.items.map((item) => item.id))
    reorder.mutate(holder === 'titular' ? [...orderedIds, ...others] : [...others, ...orderedIds])
  }

  const actions: RequirementActions = {
    onEdit: (requirement) => setDialog({ requirement, holder: requirement.holder, session: Date.now() }),
    onDeactivate: setDeactivating,
    // Desligar sempre passa pela confirmação, também pelo Switch (no celular é o único caminho)
    onToggle: (requirement, active) => (active ? setActive.mutate({ requirement, active }) : setDeactivating(requirement)),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-400">Configurações</p>
          <h1 className="text-[28px] font-semibold text-neutral-900">Documentos</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-400">
            Esta é a lista padrão. Cada cliente recebe uma cópia na primeira vez que o checklist é aberto. Mudanças
            aqui só chegam a clientes que já têm checklist pelo botão ‘Sincronizar’.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ requirement: null, holder: 'titular', session: Date.now() })}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Novo documento
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-[16px]" />
          <Skeleton className="h-36 rounded-[16px]" />
        </div>
      ) : isError ? (
        <p className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-6 text-center text-sm text-danger">
          Não foi possível carregar a lista de documentos.
        </p>
      ) : all.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="h-6 w-6" />}
          title="Nenhum documento na lista"
          description="Adicione os documentos que a imobiliária pede aos clientes."
          action={{ label: 'Novo documento', onClick: () => setDialog({ requirement: null, holder: 'titular', session: Date.now() }) }}
        />
      ) : (
        groups.map((group) => (
          <section key={group.value} className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-neutral-900">{group.label}</h2>
              <span className="text-xs text-neutral-400">
                {group.items.filter((item) => item.active).length} ativos
              </span>
            </div>
            {group.value === 'conjuge' && (
              <p className="mt-1 text-xs text-neutral-400">
                Só entram no checklist de clientes casados, em união estável ou com cônjuge informado.
              </p>
            )}
            <div className="mt-2">
              {group.items.length === 0 ? (
                <p className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-400">Nenhum documento neste grupo.</p>
              ) : (
                <RequirementList
                  requirements={group.items}
                  actions={actions}
                  togglingId={togglingId}
                  onReorder={(orderedIds) => reorderGroup(group.value, orderedIds)}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setDialog({ requirement: null, holder: group.value, session: Date.now() })}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border-[0.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 sm:h-10 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Adicionar em {group.label}
            </button>
          </section>
        ))
      )}

      {dialog && (
        <RequirementDialog
          key={dialog.session}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          requirement={dialog.requirement}
          defaultHolder={dialog.holder}
        />
      )}

      <AlertDialog
        open={deactivating !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivating(null)
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Desativar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{deactivating?.name}&quot;</strong> deixa de entrar no checklist de clientes novos. Quem já
              tem o item no checklist continua com ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:flex-row sm:justify-end sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivating) setActive.mutate({ requirement: deactivating, active: false })
              }}
              disabled={setActive.isPending}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
