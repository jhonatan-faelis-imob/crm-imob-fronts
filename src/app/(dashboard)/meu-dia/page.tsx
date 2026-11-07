'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { ApiUser } from '@/features/equipe/api'
import { LeadItemCard } from '@/features/meu-dia/components/lead-item-card'
import { PickReturnDateDialog } from '@/features/meu-dia/components/pick-return-date-dialog'
import {
  RegisterContactDialog,
  type ContactFormResult,
} from '@/features/meu-dia/components/register-contact-dialog'
import { TaskItemCard } from '@/features/meu-dia/components/task-item-card'
import {
  BANDS,
  FILTERS,
  MAX_ITEMS,
  PAGE_SIZE,
  firstName,
  greeting,
  type MyDayFilter,
} from '@/features/meu-dia/constants'
import { useMyDayActions } from '@/features/meu-dia/use-my-day-actions'
import { CompleteTaskModal, type CompleteTaskData } from '@/features/tarefas/components/complete-task-modal'
import { mapCompleteDataToDto } from '@/features/tarefas/api'
import { useHydrated } from '@/lib/use-hydrated'
import { myDayService } from '@/services/my-day.service'
import { usersService } from '@/services/users.service'
import { useAuthStore } from '@/store/auth.store'
import type { MyDayItem, MyDayLead, MyDayTask } from '@/types'

const VIEW_AS_ROLES = ['coordenador', 'gerente', 'diretor']

function plural(amount: number, singular: string, pluralForm: string) {
  return `${amount} ${amount === 1 ? singular : pluralForm}`
}

function formatToday() {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export default function MeuDiaPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  // Horário e usuário só existem no navegador: renderizar antes quebraria a hidratação
  const isHydrated = useHydrated()
  const [viewedUserId, setViewedUserId] = useState('')
  const [filter, setFilter] = useState<MyDayFilter>('todos')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [completing, setCompleting] = useState<{ item: MyDayItem; task: MyDayTask } | null>(null)
  const [contactLead, setContactLead] = useState<{ item: MyDayItem; lead: MyDayLead } | null>(null)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [returnLead, setReturnLead] = useState<{ item: MyDayItem; lead: MyDayLead } | null>(null)
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  // Cada abertura remonta o formulário limpo
  const [formSession, setFormSession] = useState(0)

  const canViewAs = isHydrated && !!user && VIEW_AS_ROLES.includes(user.role)
  const scope = viewedUserId || 'me'

  const { data: users } = useQuery<ApiUser[]>({
    queryKey: ['users'],
    queryFn: () => usersService.findAll(),
    enabled: canViewAs,
  })

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['my-day', scope, limit],
    queryFn: () => myDayService.get({ limit, userId: viewedUserId || undefined }),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    // Mantém a lista ao carregar mais, mas nunca mostra a de outro usuário
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === scope ? previous : undefined),
  })

  const { completeTask, postponeTask, scheduleReturn, registerContact } = useMyDayActions(data?.viewingUser.id)

  const items = data?.items ?? []
  const counts = data?.summary.counts
  const visibleItems =
    filter === 'todos' ? items : items.filter((item) => item.reasons.some((reason) => reason.code === filter))
  const isViewingOther = !!data && !!user && data.viewingUser.id !== user.id
  const doneToday = data?.summary.doneToday
  const hasMore = !!counts && counts.total > items.length
  const canLoadMore = hasMore && limit < MAX_ITEMS

  function selectUser(id: string) {
    setViewedUserId(id)
    setLimit(PAGE_SIZE)
    setFilter('todos')
  }

  function confirmComplete(result: CompleteTaskData) {
    if (!completing) return
    const { item, task } = completing
    completeTask.mutate({
      itemKey: item.key,
      leadId: item.lead?.id,
      taskId: task.id,
      dto: mapCompleteDataToDto(result),
    })
    setCompleting(null)
  }

  function openContact(item: MyDayItem, lead: MyDayLead) {
    setContactLead({ item, lead })
    setFormSession((session) => session + 1)
    setIsContactOpen(true)
  }

  function saveContact(result: ContactFormResult) {
    if (!contactLead) return
    registerContact.mutate(
      { itemKey: contactLead.item.key, leadId: contactLead.lead.id, ...result },
      { onSuccess: () => setIsContactOpen(false) },
    )
  }

  function schedule(item: MyDayItem, lead: MyDayLead, dueDate: Date) {
    scheduleReturn.mutate({ itemKey: item.key, leadId: lead.id, leadName: lead.name, dueDate })
  }

  function openReturnPicker(item: MyDayItem, lead: MyDayLead) {
    setReturnLead({ item, lead })
    setFormSession((session) => session + 1)
    setIsReturnOpen(true)
  }

  function renderItem(item: MyDayItem) {
    const highlight = item.key === visibleItems[0]?.key
    const { lead } = item

    if (lead) {
      return (
        <LeadItemCard
          key={item.key}
          item={item}
          lead={lead}
          highlight={highlight}
          onCompleteTask={(task) => setCompleting({ item, task })}
          onRegisterContact={() => openContact(item, lead)}
          onScheduleReturn={(date) => schedule(item, lead, date)}
          onPickReturnDate={() => openReturnPicker(item, lead)}
        />
      )
    }

    const [task] = item.tasks
    return (
      <TaskItemCard
        key={item.key}
        item={item}
        task={task}
        highlight={highlight}
        onComplete={() => setCompleting({ item, task })}
        onPostpone={(dueDate) => postponeTask.mutate({ itemKey: item.key, taskId: task.id, dueDate })}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-h-[76px] min-w-0">
          <h1 className="text-[28px] font-semibold text-neutral-900">Meu dia</h1>
          {isHydrated && (
            <>
              <p className="text-base font-medium text-neutral-600">
                {greeting(new Date().getHours())}
                {user ? `, ${firstName(user.name)}` : ''}
              </p>
              <p className="text-sm text-neutral-400">{formatToday()}</p>
            </>
          )}
        </div>

        {canViewAs && (
          <div className="sm:w-56">
            <label htmlFor="view-as" className="text-[13px] font-medium text-neutral-900">
              Ver como
            </label>
            <select
              id="view-as"
              value={viewedUserId}
              onChange={(event) => selectUser(event.target.value)}
              className="mt-1.5 w-full rounded-[12px] border-[0.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none focus:border-brand"
            >
              <option value="">Eu</option>
              {(users ?? [])
                .filter((option) => option.active && option.id !== user.id)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {doneToday && data && (
        <p className="rounded-[12px] bg-[#E8F5E9] px-4 py-2.5 text-sm font-medium text-success">
          Hoje {isViewingOther ? `${firstName(data.viewingUser.name)} já concluiu` : 'você já concluiu'}{' '}
          {plural(doneToday.tasks, 'tarefa', 'tarefas')} e fez {plural(doneToday.contacts, 'contato', 'contatos')}
        </p>
      )}

      {counts && counts.total > 0 && (
        <div className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {FILTERS.map((option) => {
            const isActive = filter === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(option.value)}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border-[0.5px] px-3 text-sm font-medium transition-colors sm:min-h-9 ${
                  isActive
                    ? 'border-brand bg-brand text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {option.label} {counts[option.count]}
              </button>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-[16px]" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-6 text-center text-sm text-danger">
          Não foi possível carregar o seu dia.
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-6 w-6" />}
          title="Tudo em dia 🎉"
          description="Você não tem pendências agora."
          action={{ label: 'Novo lead', onClick: () => router.push('/leads') }}
        />
      ) : (
        <div className="space-y-6">
          {visibleItems.length === 0 && (
            <p className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400">
              {canLoadMore ? 'Nenhum item neste filtro entre os carregados.' : 'Nenhum item neste filtro.'}
            </p>
          )}

          {BANDS.map((band) => {
            const bandItems = visibleItems.filter((item) => item.band === band.value)
            if (bandItems.length === 0) return null
            return (
              <section key={band.value} className="space-y-3">
                <h2 className="text-[20px] font-semibold text-neutral-900">{band.title}</h2>
                {bandItems.map(renderItem)}
              </section>
            )
          })}

          {canLoadMore && (
            <button
              type="button"
              onClick={() => setLimit((current) => Math.min(current + PAGE_SIZE, MAX_ITEMS))}
              disabled={isFetching}
              className="h-11 w-full rounded-[8px] border-[1.5px] border-neutral-200 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Carregar mais
            </button>
          )}
          {hasMore && !canLoadMore && (
            <p className="text-center text-sm text-neutral-400">Mostrando os {MAX_ITEMS} itens mais prioritários.</p>
          )}
        </div>
      )}

      <CompleteTaskModal
        task={completing?.task ?? null}
        open={!!completing}
        onClose={() => setCompleting(null)}
        onConfirm={confirmComplete}
      />

      {contactLead && (
        <RegisterContactDialog
          key={formSession}
          open={isContactOpen}
          onOpenChange={setIsContactOpen}
          leadName={contactLead.lead.name}
          isSaving={registerContact.isPending}
          onSave={saveContact}
        />
      )}

      {returnLead && (
        <PickReturnDateDialog
          key={formSession}
          open={isReturnOpen}
          onOpenChange={setIsReturnOpen}
          onConfirm={(date) => {
            schedule(returnLead.item, returnLead.lead, date)
            setIsReturnOpen(false)
          }}
        />
      )}
    </div>
  )
}
