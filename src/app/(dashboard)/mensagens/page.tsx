'use client'

import { useState } from 'react'
import { MessageSquareText, Plus, Search } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { TemplateCard } from '@/features/mensagens/components/template-card'
import { TemplateFormDialog } from '@/features/mensagens/components/template-form-dialog'
import { normalizeSearch } from '@/features/mensagens/components/template-picker'
import { TEMPLATE_TYPES, canManageTemplate, templateTypeMeta } from '@/features/mensagens/constants'
import { messageTemplatesService } from '@/services/message-templates.service'
import { useAuthStore } from '@/store/auth.store'
import type { MessageTemplate } from '@/types'

export default function MensagensPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  // Cada abertura remonta o formulário com os valores do modelo escolhido
  const [formSession, setFormSession] = useState(0)
  const [deletingTemplate, setDeletingTemplate] = useState<MessageTemplate | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data: templates, isLoading, isError } = useQuery({
    queryKey: ['message-templates'],
    queryFn: messageTemplatesService.findAll,
  })

  const removeTemplate = useMutation({
    mutationFn: (id: string) => messageTemplatesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
      toast.add({ title: 'Modelo excluído', type: 'success' })
      setIsDeleteOpen(false)
    },
    onError: () => toast.add({ title: 'Não foi possível excluir o modelo', type: 'error' }),
  })

  function openForm(template: MessageTemplate | null) {
    setEditingTemplate(template)
    setFormSession((session) => session + 1)
    setIsFormOpen(true)
  }

  const term = normalizeSearch(search.trim())
  const visibleTemplates = (templates ?? []).filter(
    (template) =>
      (!typeFilter || templateTypeMeta(template.type).value === typeFilter) &&
      normalizeSearch(`${template.name} ${template.content}`).includes(term),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-400">Configurações</p>
          <h1 className="text-[28px] font-semibold text-neutral-900">Mensagens</h1>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Novo modelo
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar modelo"
            aria-label="Buscar modelo"
            className="w-full rounded-[12px] border-[0.5px] border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filtrar por tipo"
          className="rounded-[12px] border-[0.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none focus:border-brand sm:w-52"
        >
          <option value="">Todos os tipos</option>
          {TEMPLATE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-[16px]" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-6 text-center text-sm text-danger">
          Não foi possível carregar os modelos.
        </p>
      ) : visibleTemplates.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText className="h-6 w-6" />}
          title="Nenhum modelo encontrado"
          description="Crie um modelo para enviar mensagens de WhatsApp com os dados do lead já preenchidos."
          action={{ label: 'Novo modelo', onClick: () => openForm(null) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              canManage={canManageTemplate(template, user)}
              onEdit={() => openForm(template)}
              onDelete={() => {
                setDeletingTemplate(template)
                setIsDeleteOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <TemplateFormDialog key={formSession} open={isFormOpen} onOpenChange={setIsFormOpen} template={editingTemplate} />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo {deletingTemplate?.name} será excluído
              {deletingTemplate?.isPublic ? ' para toda a imobiliária' : ''}. As interações já registradas não são
              afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && removeTemplate.mutate(deletingTemplate.id)}
              disabled={removeTemplate.isPending}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              Excluir modelo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
