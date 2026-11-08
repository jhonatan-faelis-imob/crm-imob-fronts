'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { propertiesService } from '@/services/properties.service'
import type { AiDescribeRequest, AiDescribeResponse } from '../portal/types'
import { apiErrorDetails } from '../portal/use-portal-config'

type Target = 'title' | 'description' | 'both'

const TARGET_LABEL: Record<Target, string> = {
  title: 'o título',
  description: 'a descrição',
  both: 'o título e a descrição',
}

// Gera título e descrição pela IA. O resultado fica numa prévia e nunca sobrescreve texto sem confirmar
export function AiDescribePanel({
  buildRequest,
  disabledReason,
  currentTitle,
  currentDescription,
  onApply,
}: {
  /** Lido no clique, com os valores do momento */
  buildRequest: () => AiDescribeRequest
  disabledReason: string | null
  currentTitle: string
  currentDescription: string
  onApply: (changes: Partial<AiDescribeResponse>) => void
}) {
  const [result, setResult] = useState<AiDescribeResponse | null>(null)
  const [confirming, setConfirming] = useState<Target | null>(null)

  const generate = useMutation({
    mutationFn: () => propertiesService.aiDescribe(buildRequest()),
    onSuccess: (data) => {
      setResult(data)
      setConfirming(null)
    },
  })
  const error = generate.isError ? apiErrorDetails(generate.error).message ?? 'Não foi possível gerar agora.' : null

  function wouldOverwrite(target: Target) {
    if (!result) return false
    const title = (target === 'title' || target === 'both') && currentTitle.trim() !== '' && currentTitle.trim() !== result.title
    const description =
      (target === 'description' || target === 'both') &&
      currentDescription.trim() !== '' &&
      currentDescription.trim() !== result.description
    return title || description
  }

  function apply(target: Target, confirmed = false) {
    if (!result) return
    if (!confirmed && wouldOverwrite(target)) {
      setConfirming(target)
      return
    }
    onApply({
      title: target === 'description' ? undefined : result.title,
      description: target === 'title' ? undefined : result.description,
    })
    setConfirming(null)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => generate.mutate()}
        disabled={disabledReason !== null || generate.isPending}
        className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border-[1.5px] border-brand px-4 text-sm font-medium text-brand transition-colors hover:bg-brand-bg disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 disabled:hover:bg-transparent sm:min-h-10"
      >
        {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {generate.isPending ? 'Gerando…' : 'Gerar título e descrição com IA'}
      </button>
      {disabledReason && <p className="text-xs text-neutral-400">{disabledReason}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}

      {result && (
        <div className="space-y-3 rounded-[12px] border-[0.5px] border-neutral-200 bg-neutral-100 p-3">
          <div>
            <p className="text-xs font-medium text-neutral-400">Título sugerido ({result.title.length}/100)</p>
            <p className="mt-0.5 text-sm font-medium text-neutral-900">{result.title}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-400">Descrição sugerida ({result.description.length} caracteres)</p>
            <p className="mt-0.5 whitespace-pre-line text-sm text-neutral-600">{result.description}</p>
          </div>
          <p className="text-xs text-neutral-400">Revise antes de usar: a IA pode errar.</p>

          {confirming ? (
            <div className="space-y-2 rounded-[8px] bg-white p-3">
              <p className="text-sm text-neutral-900">Isto substitui {TARGET_LABEL[confirming]} que você já escreveu.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => apply(confirming, true)}
                  className="min-h-10 rounded-[8px] bg-brand px-3 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  Substituir
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="min-h-10 rounded-[8px] border-[0.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-600"
                >
                  Manter o meu
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(['title', 'description', 'both'] as const).map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => apply(target)}
                  className="min-h-10 rounded-[8px] border-[0.5px] border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand"
                >
                  {target === 'title' ? 'Usar título' : target === 'description' ? 'Usar descrição' : 'Usar os dois'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
