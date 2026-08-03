'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch, type Control } from 'react-hook-form'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { Task, TaskPriority, TaskType } from '@/types'
import { PRIORITY_META, TASK_PRIORITIES, TASK_TYPE_META, TASK_TYPES } from './constants'

export interface TaskLeadOption {
  id: string
  name: string
}

const TASK_TYPE_VALUES = TASK_TYPES as [TaskType, ...TaskType[]]
const TASK_PRIORITY_VALUES = TASK_PRIORITIES as [TaskPriority, ...TaskPriority[]]

const newTaskSchema = z.object({
  type: z.enum(TASK_TYPE_VALUES),
  title: z.string().min(1, 'Informe o título'),
  leadId: z.string().optional(),
  assignedTo: z.string().min(1, 'Selecione o responsável'),
  priority: z.enum(TASK_PRIORITY_VALUES),
  date: z.string().min(1, 'Informe a data'),
  time: z.string().min(1, 'Informe o horário'),
  description: z.string().optional(),
  hasNextTask: z.boolean(),
  nextType: z.enum(TASK_TYPE_VALUES).optional(),
  nextTitle: z.string().optional(),
  nextDaysAfter: z.string().optional(),
})

export type NewTaskFormValues = z.infer<typeof newTaskSchema>

const emptyDefaultValues: NewTaskFormValues = {
  type: 'ligacao',
  title: '',
  leadId: '',
  assignedTo: '',
  priority: 'media',
  date: '',
  time: '',
  description: '',
  hasNextTask: false,
  nextType: 'ligacao',
  nextTitle: '',
  nextDaysAfter: '3',
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function taskToFormValues(task: Task): NewTaskFormValues {
  const due = new Date(task.dueDate)
  return {
    type: task.type,
    title: task.title,
    leadId: task.leadId ?? '',
    assignedTo: task.assignedTo,
    priority: task.priority,
    date: `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`,
    time: `${pad(due.getHours())}:${pad(due.getMinutes())}`,
    description: task.description ?? '',
    hasNextTask: task.hasNextTask,
    nextType: task.nextTaskType ?? 'ligacao',
    nextTitle: task.nextTaskTitle ?? '',
    nextDaysAfter: task.nextTaskDaysAfter ? String(task.nextTaskDaysAfter) : '3',
  }
}

const inputClassName =
  'w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand'
const labelClassName = 'mb-1.5 block text-[13px] font-medium text-neutral-900'
const errorClassName = 'mt-1 text-[12px] text-danger'

function TypePicker({ value, onChange }: { value: TaskType; onChange: (type: TaskType) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TASK_TYPES.map((type) => {
        const meta = TASK_TYPE_META[type]
        const Icon = meta.icon
        const isSelected = value === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-xs font-medium transition-colors ${
              isSelected
                ? 'border-brand bg-brand-bg text-brand'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}

function PriorityPicker({ value, onChange }: { value: TaskPriority; onChange: (priority: TaskPriority) => void }) {
  return (
    <div className="flex gap-1.5">
      {TASK_PRIORITIES.map((priority) => {
        const meta = PRIORITY_META[priority]
        const isSelected = value === priority
        return (
          <button
            key={priority}
            type="button"
            onClick={() => onChange(priority)}
            className={`flex-1 rounded-[8px] border-[1.5px] px-3 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? 'border-brand bg-brand-bg text-brand'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}

function LeadSearchSelect({ control, leads }: { control: Control<NewTaskFormValues>; leads: TaskLeadOption[] }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Controller
      control={control}
      name="leadId"
      render={({ field }) => {
        const selectedLead = leads.find((lead) => lead.id === field.value)
        const normalized = query.trim().toLowerCase()
        const results = normalized
          ? leads.filter((lead) => lead.name.toLowerCase().includes(normalized))
          : leads

        return (
          <div className="relative">
            <input
              value={selectedLead ? selectedLead.name : query}
              onChange={(event) => {
                field.onChange('')
                setQuery(event.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 150)}
              placeholder="Buscar lead..."
              className={inputClassName}
            />
            {selectedLead && (
              <button
                type="button"
                onClick={() => {
                  field.onChange('')
                  setQuery('')
                }}
                aria-label="Remover lead vinculado"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isOpen && !selectedLead && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-[12px] border-[1.5px] border-neutral-200 bg-white p-1 shadow-lg">
                {results.length === 0 && (
                  <p className="px-3 py-2 text-sm text-neutral-400">Nenhum lead encontrado</p>
                )}
                {results.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      field.onChange(lead.id)
                      setQuery('')
                      setIsOpen(false)
                    }}
                    className="block w-full rounded-[8px] px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100"
                  >
                    {lead.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      }}
    />
  )
}

// Mounted fresh via a `key` every time the dialog opens (or targets a different task),
// so it always starts with the correct values without needing an effect to reset state.
function NewTaskFormBody({
  initialValues,
  submitLabel,
  onCancel,
  onSubmit,
  leads,
  brokers,
}: {
  initialValues: NewTaskFormValues
  submitLabel: string
  onCancel: () => void
  onSubmit: (data: NewTaskFormValues) => void
  leads: TaskLeadOption[]
  brokers: { id: string; name: string }[]
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewTaskFormValues>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: initialValues,
  })

  const hasNextTask = useWatch({ control, name: 'hasNextTask' })

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <div>
          <label className={labelClassName}>Tipo</label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => <TypePicker value={field.value} onChange={field.onChange} />}
          />
        </div>

        <div>
          <label htmlFor="new-task-title" className={labelClassName}>
            Título da tarefa
            <span className="text-brand"> *</span>
          </label>
          <input id="new-task-title" className={inputClassName} {...register('title')} />
          {errors.title && <p className={errorClassName}>{errors.title.message}</p>}
        </div>

        <div>
          <label className={labelClassName}>Lead vinculado</label>
          <LeadSearchSelect control={control} leads={leads} />
        </div>

        <div>
          <label htmlFor="new-task-assignee" className={labelClassName}>
            Responsável
          </label>
          <select id="new-task-assignee" defaultValue="" className={inputClassName} {...register('assignedTo')}>
            <option value="" disabled>
              Selecione o corretor
            </option>
            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.name}
              </option>
            ))}
          </select>
          {errors.assignedTo && <p className={errorClassName}>{errors.assignedTo.message}</p>}
        </div>

        <div>
          <label className={labelClassName}>Prioridade</label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => <PriorityPicker value={field.value} onChange={field.onChange} />}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="new-task-date" className={labelClassName}>
              Data
              <span className="text-brand"> *</span>
            </label>
            <input id="new-task-date" type="date" className={inputClassName} {...register('date')} />
            {errors.date && <p className={errorClassName}>{errors.date.message}</p>}
          </div>
          <div>
            <label htmlFor="new-task-time" className={labelClassName}>
              Horário
              <span className="text-brand"> *</span>
            </label>
            <input id="new-task-time" type="time" className={inputClassName} {...register('time')} />
            {errors.time && <p className={errorClassName}>{errors.time.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="new-task-description" className={labelClassName}>
            Descrição
          </label>
          <textarea id="new-task-description" rows={3} className={inputClassName} {...register('description')} />
        </div>

        <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-900">
          <input type="checkbox" className="h-4 w-4 accent-brand" {...register('hasNextTask')} />
          Ao concluir, criar próxima tarefa automaticamente
        </label>

        {hasNextTask && (
          <div className="space-y-4 rounded-[12px] bg-neutral-100 p-3">
            <div>
              <label className={labelClassName}>Tipo da próxima tarefa</label>
              <Controller
                control={control}
                name="nextType"
                render={({ field }) => <TypePicker value={field.value ?? 'ligacao'} onChange={field.onChange} />}
              />
            </div>
            <div>
              <label htmlFor="new-task-next-title" className={labelClassName}>
                Título da próxima tarefa
              </label>
              <input id="new-task-next-title" className={inputClassName} {...register('nextTitle')} />
            </div>
            <div>
              <label htmlFor="new-task-next-days" className={labelClassName}>
                Dias após conclusão
              </label>
              <input
                id="new-task-next-days"
                type="number"
                min="1"
                className={inputClassName}
                {...register('nextDaysAfter')}
              />
            </div>
          </div>
        )}
      </form>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          {submitLabel}
        </button>
      </DialogFooter>
    </>
  )
}

export function NewTaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
  leads,
  brokers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onSave: (data: NewTaskFormValues, taskId?: string) => void
  leads: TaskLeadOption[]
  brokers: { id: string; name: string }[]
}) {
  const isEditing = task !== undefined && task !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados da tarefa.' : 'Cadastre uma nova tarefa de follow-up.'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <NewTaskFormBody
            key={task ? task.id : 'new'}
            initialValues={task ? taskToFormValues(task) : emptyDefaultValues}
            submitLabel={isEditing ? 'Salvar alterações' : 'Salvar'}
            onCancel={() => onOpenChange(false)}
            leads={leads}
            brokers={brokers}
            onSubmit={(data) => {
              onSave(data, task?.id)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
