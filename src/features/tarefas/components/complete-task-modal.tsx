'use client'

import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Task, TaskType } from '@/types'
import { TASK_TYPE_META, TASK_TYPES } from '../constants'

export interface CompleteTaskData {
  notes: string
  hasNextTask: boolean
  nextTask?: {
    type: TaskType
    title: string
    dueDate: string
    dueTime: string
  }
}

const inputClassName =
  'w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand'
const labelClassName = 'mb-1.5 block text-[13px] font-medium text-neutral-900'
const errorClassName = 'mt-1 text-[12px] text-danger'

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultNextDate() {
  const date = new Date()
  date.setDate(date.getDate() + 3)
  return formatDateInputValue(date)
}

// Mounted fresh via a `key` every time the modal opens for a task, so it always
// starts with clean values without needing an effect to reset state.
function CompleteTaskForm({
  task,
  onCancel,
  onConfirm,
}: {
  task: Task
  onCancel: () => void
  onConfirm: (data: CompleteTaskData) => void
}) {
  const [notes, setNotes] = useState('')
  const [hasNextTask, setHasNextTask] = useState(false)
  const [nextType, setNextType] = useState<TaskType>(task.type)
  const [nextTitle, setNextTitle] = useState('')
  const [nextDate, setNextDate] = useState(defaultNextDate())
  const [nextTime, setNextTime] = useState('09:00')
  const [titleError, setTitleError] = useState(false)

  function handleConfirm() {
    if (hasNextTask && nextTitle.trim() === '') {
      setTitleError(true)
      return
    }

    onConfirm({
      notes,
      hasNextTask,
      nextTask: hasNextTask
        ? { type: nextType, title: nextTitle.trim(), dueDate: nextDate, dueTime: nextTime }
        : undefined,
    })
  }

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <div>
          <label htmlFor="complete-task-notes" className={labelClassName}>
            O que foi feito?
          </label>
          <textarea
            id="complete-task-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Descreva brevemente o resultado desta tarefa..."
            className={inputClassName}
          />
        </div>

        <div className="border-t-[0.5px] border-neutral-200 pt-4">
          <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-900">
            <input
              type="checkbox"
              checked={hasNextTask}
              onChange={(event) => setHasNextTask(event.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Criar próxima tarefa
          </label>

          <div
            className={`grid transition-all duration-200 ease-in-out ${
              hasNextTask ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="space-y-4 overflow-hidden">
              <div>
                <label htmlFor="complete-task-next-type" className={labelClassName}>
                  Tipo
                </label>
                <select
                  id="complete-task-next-type"
                  value={nextType}
                  onChange={(event) => setNextType(event.target.value as TaskType)}
                  className={inputClassName}
                >
                  {TASK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TASK_TYPE_META[type].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="complete-task-next-title" className={labelClassName}>
                  Título da próxima tarefa
                  <span className="text-brand"> *</span>
                </label>
                <input
                  id="complete-task-next-title"
                  value={nextTitle}
                  onChange={(event) => {
                    setNextTitle(event.target.value)
                    if (titleError) setTitleError(false)
                  }}
                  className={inputClassName}
                />
                {titleError && <p className={errorClassName}>Informe o título da próxima tarefa</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="complete-task-next-date" className={labelClassName}>
                    Data
                    <span className="text-brand"> *</span>
                  </label>
                  <input
                    id="complete-task-next-date"
                    type="date"
                    value={nextDate}
                    onChange={(event) => setNextDate(event.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="complete-task-next-time" className={labelClassName}>
                    Horário
                    <span className="text-brand"> *</span>
                  </label>
                  <input
                    id="complete-task-next-time"
                    type="time"
                    value={nextTime}
                    onChange={(event) => setNextTime(event.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Concluir tarefa
        </button>
      </DialogFooter>
    </>
  )
}

/**
 * Single source of truth for "conclude a task" across the app — the list/calendar
 * views in `/tarefas`, the lead detail's tasks tab, and its "Próxima tarefa" card
 * all render this same modal so the flow looks and behaves identically everywhere.
 */
export function CompleteTaskModal({
  task,
  open,
  onClose,
  onConfirm,
}: {
  task: Task | null
  open: boolean
  onClose: () => void
  onConfirm: (data: CompleteTaskData) => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 flex-row items-center gap-3 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-success">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <DialogTitle>Concluir tarefa</DialogTitle>
            <DialogDescription className="truncate">{task?.title}</DialogDescription>
          </div>
        </DialogHeader>

        {open && task && <CompleteTaskForm key={task.id} task={task} onCancel={onClose} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  )
}
