'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, PlugZap, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { integrationsService, type AiSettings, type UpdateAiSettingsDto } from '@/services/integrations.service'
import { apiMessage, INTEGRATIONS_QUERY_KEY } from '../constants'
import { Notice, PanelShell } from './panel-shell'

const AI_KEY = [...INTEGRATIONS_QUERY_KEY, 'ai'] as const

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="min-w-0">
        <span className="block text-sm font-medium text-neutral-900">{label}</span>
        <span className="block text-xs text-neutral-400">{description}</span>
      </label>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}

export function AiPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const [apiKey, setApiKey] = useState('')
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: AI_KEY,
    queryFn: integrationsService.ai.get,
    enabled: open,
  })

  function applied(updated: AiSettings) {
    queryClient.setQueryData(AI_KEY, updated)
    queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY })
  }

  const update = useMutation({
    mutationFn: (dto: UpdateAiSettingsDto) => integrationsService.ai.update(dto),
    onSuccess: (updated) => {
      applied(updated)
      setTestResult(null)
    },
    onError: (error) => toast.add({ title: apiMessage(error, 'Não foi possível salvar'), type: 'error' }),
  })

  const saveKey = useMutation({
    mutationFn: () => integrationsService.ai.saveKey(apiKey.trim()),
    onSuccess: (updated) => {
      applied(updated)
      setApiKey('')
      setTestResult(null)
      toast.add({ title: 'Chave salva', description: 'Clique em “Testar conexão” para conferir.', type: 'success' })
    },
    onError: (error) => toast.add({ title: apiMessage(error, 'Não foi possível salvar a chave'), type: 'error' }),
  })

  const removeKey = useMutation({
    mutationFn: integrationsService.ai.removeKey,
    onSuccess: (updated) => {
      applied(updated)
      setTestResult(null)
      toast.add({ title: 'Chave removida', description: 'A IA volta a usar a chave do sistema.', type: 'success' })
    },
    onError: (error) => toast.add({ title: apiMessage(error, 'Não foi possível remover a chave'), type: 'error' }),
  })

  const test = useMutation({
    mutationFn: integrationsService.ai.test,
    onSuccess: (result) => {
      setTestResult(result)
      queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY })
    },
    onError: (error) => setTestResult({ ok: false, message: apiMessage(error, 'Não foi possível testar agora') }),
  })

  const busy = update.isPending

  return (
    <PanelShell
      open={open}
      onOpenChange={onOpenChange}
      title="Inteligência artificial"
      description="Análise de leads e textos de imóveis com o Gemini."
      status={settings?.status}
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-[12px]" />
          <Skeleton className="h-32 rounded-[12px]" />
        </div>
      ) : isError || !settings ? (
        <Notice tone="danger">Não foi possível carregar a configuração de IA.</Notice>
      ) : (
        <>
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Recursos</h3>
            <ToggleRow
              id="ai-lead-score"
              label="Análise de lead"
              description="Score e próximos passos no detalhe do lead."
              checked={settings.enabled && settings.features.leadScore}
              disabled={busy}
              onChange={(checked) =>
                update.mutate(checked && !settings.enabled ? { enabled: true, features: { leadScore: true } } : { features: { leadScore: checked } })
              }
            />
            <ToggleRow
              id="ai-property-copy"
              label="Título e descrição de imóvel"
              description="Texto do anúncio no cadastro de revenda."
              checked={settings.enabled && settings.features.propertyCopy}
              disabled={busy}
              onChange={(checked) =>
                update.mutate(checked && !settings.enabled ? { enabled: true, features: { propertyCopy: true } } : { features: { propertyCopy: checked } })
              }
            />
          </section>

          <section className="space-y-3 border-t-[0.5px] border-neutral-200 pt-5">
            <ToggleRow
              id="ai-own-key"
              label="Usar minha própria chave do Gemini"
              description={
                settings.systemKeyConfigured
                  ? 'Sem chave própria, a IA usa a chave do sistema.'
                  : 'O sistema não tem chave configurada: use uma chave própria.'
              }
              checked={settings.useOwnKey}
              disabled={busy}
              onChange={(checked) => update.mutate({ useOwnKey: checked })}
            />

            {settings.useOwnKey && (
              <div className="space-y-2">
                {settings.hasOwnKey && (
                  <div className="flex items-center justify-between gap-2 rounded-[12px] bg-neutral-100 px-3 py-2">
                    <span className="font-mono text-sm text-neutral-900">{settings.keyMasked ?? '••••'}</span>
                    <button
                      type="button"
                      onClick={() => removeKey.mutate()}
                      disabled={removeKey.isPending}
                      className="text-xs font-medium text-danger hover:underline disabled:opacity-60"
                    >
                      Remover chave
                    </button>
                  </div>
                )}
                {settings.secretsError && <Notice tone="danger">{settings.secretsError}</Notice>}
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (apiKey.trim().length >= 10) saveKey.mutate()
                  }}
                >
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={settings.hasOwnKey ? 'Trocar a chave' : 'Cole a chave do Gemini'}
                    autoComplete="off"
                    aria-label="Chave do Gemini"
                    className="h-10 min-w-0 flex-1 rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={saveKey.isPending || apiKey.trim().length < 10}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                  >
                    {saveKey.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar
                  </button>
                </form>
                <p className="text-xs text-neutral-400">A chave fica guardada criptografada e nunca é exibida de novo.</p>
              </div>
            )}
          </section>

          <section className="space-y-3 border-t-[0.5px] border-neutral-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-neutral-400">Modelo: {settings.model}</p>
              <button
                type="button"
                onClick={() => test.mutate()}
                disabled={test.isPending}
                className="inline-flex h-10 items-center gap-2 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60"
              >
                {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                Testar conexão
              </button>
            </div>
            {testResult && (
              <div
                role="status"
                className={cn(
                  'flex items-start gap-2 rounded-[12px] p-3 text-sm',
                  testResult.ok ? 'bg-[#E8F5E9] text-success' : 'bg-danger-bg text-danger',
                )}
              >
                {testResult.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span className="min-w-0 break-words">{testResult.message}</span>
              </div>
            )}
          </section>

          <Notice tone="info">
            Para gerar as análises, os dados do lead (como nome, renda e histórico) são enviados ao provedor de IA. Informe isso
            na sua política de privacidade.
          </Notice>
        </>
      )}
    </PanelShell>
  )
}
