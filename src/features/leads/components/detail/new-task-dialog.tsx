'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { TaskPriority, TaskType } from '@/types'

const TASK_TYPE_META: Record<TaskType, string> = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  visita: 'Visita',
  reuniao: 'Reunião',
  outro: 'Outro',
}

const TASK_PRIORITY_META: Record<TaskPriority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

const TASK_TYPES = Object.keys(TASK_TYPE_META) as [TaskType, ...TaskType[]]
const TASK_PRIORITIES = Object.keys(TASK_PRIORITY_META) as [TaskPriority, ...TaskPriority[]]

const newTaskSchema = z.object({
  title: z.string().min(1, 'Informe o título'),
  type: z.enum(TASK_TYPES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().min(1, 'Informe a data'),
})

export type NewTaskFormValues = z.infer<typeof newTaskSchema>

const inputClassName =
  'w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand'
const labelClassName = 'mb-1.5 block text-[13px] font-medium text-neutral-900'
const errorClassName = 'mt-1 text-[12px] text-danger'

export function NewTaskDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: NewTaskFormValues) => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewTaskFormValues>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: { title: '', type: 'ligacao', priority: 'media', dueDate: '' },
  })

  function close() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(data: NewTaskFormValues) {
    onCreate(data)
    close()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen: boolean) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>Agende uma nova tarefa para este lead.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-4 sm:p-6">
          <div>
            <label htmlFor="task-title" className={labelClassName}>
              Título
            </label>
            <input id="task-title" className={inputClassName} {...register('title')} />
            {errors.title && <p className={errorClassName}>{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-type" className={labelClassName}>
                Tipo
              </label>
              <select id="task-type" className={inputClassName} {...register('type')}>
                {TASK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TASK_TYPE_META[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="task-priority" className={labelClassName}>
                Prioridade
              </label>
              <select id="task-priority" className={inputClassName} {...register('priority')}>
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {TASK_PRIORITY_META[priority]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-due" className={labelClassName}>
              Data e hora
            </label>
            <input id="task-due" type="datetime-local" className={inputClassName} {...register('dueDate')} />
            {errors.dueDate && <p className={errorClassName}>{errors.dueDate.message}</p>}
          </div>
        </form>

        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
          <button
            type="button"
            onClick={close}
            className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Criar tarefa
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
