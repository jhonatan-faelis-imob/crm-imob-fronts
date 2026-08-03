'use client'

import { Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { leadsService } from '@/services/leads.service'
import { toast } from '@/components/ui/toast'

interface AiAnalysisResult {
  score: number
  summary: string
  nextSteps: string[]
  hotLevel?: string
}

// Mounted fresh via a `key` every time the dialog opens, so it always starts loading
// and fires a new analysis without needing an effect to imperatively reset state.
function AiAnalysisBody({ leadId }: { leadId: string }) {
  const queryClient = useQueryClient()
  const { mutate, data, isPending, isError } = useMutation<AiAnalysisResult>({
    mutationFn: () => leadsService.analyzeAI(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível analisar o lead com IA', type: 'error' })
    },
  })

  useEffect(() => {
    mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-sm font-medium text-neutral-900">Não foi possível concluir a análise.</p>
        <p className="text-xs text-neutral-400">
          Verifique se a integração com o Gemini está configurada no backend.
        </p>
      </div>
    )
  }

  if (isPending || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-brand-bg text-brand">
          <Sparkles className="h-7 w-7" />
        </div>
        <p className="text-sm text-neutral-400">Analisando dados do lead...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-[12px] bg-neutral-100 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-lg font-semibold text-success">
          {data.score}
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900">Score: {data.score}/100</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-400">Resumo</p>
        <p className="mt-1 text-sm text-neutral-900">{data.summary}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-400">Próximos passos sugeridos</p>
        <ul className="mt-1.5 space-y-1.5">
          {data.nextSteps.map((step) => (
            <li key={step} className="flex items-start gap-2 text-sm text-neutral-900">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function AiAnalysisDialog({
  open,
  onOpenChange,
  leadId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            Análise com IA
          </DialogTitle>
          <DialogDescription>Score e próximos passos sugeridos para este lead.</DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6">{open && <AiAnalysisBody key={leadId} leadId={leadId} />}</div>
      </DialogContent>
    </Dialog>
  )
}
