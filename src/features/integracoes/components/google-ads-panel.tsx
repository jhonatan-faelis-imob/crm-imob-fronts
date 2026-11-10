'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, KeyRound, Loader2, Power, X } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/toast'
import { usersService } from '@/services/users.service'
import { integrationsService, type GoogleAdsView, type IntakeConfig } from '@/services/integrations.service'
import { apiMessage, INTEGRATIONS_QUERY_KEY } from '../constants'
import { EventsList } from './events-list'
import { CopyButton, Notice, PanelShell, Step } from './panel-shell'

const REVEAL_MS = 30_000
const GOOGLE_KEY = [...INTEGRATIONS_QUERY_KEY, 'google_ads'] as const

interface UserOption {
  id: string
  name: string
  role: string
  active: boolean
}

const fieldClassName =
  'h-10 w-full min-w-0 rounded-[12px] border-[1.5px] border-neutral-200 bg-neutral-100 px-3 text-[16px] text-neutral-900 outline-none sm:text-sm'

function KeyField({ view }: { view: GoogleAdsView }) {
  const [revealed, setRevealed] = useState<string | null>(null)

  // A chave aberta some sozinha depois de 30 segundos
  useEffect(() => {
    if (!revealed) return
    const timer = window.setTimeout(() => setRevealed(null), REVEAL_MS)
    return () => window.clearTimeout(timer)
  }, [revealed])

  const reveal = useMutation({
    mutationFn: integrationsService.googleAds.revealKey,
    onSuccess: (key) => setRevealed(key),
    onError: (error) => toast.add({ title: apiMessage(error, 'Não foi possível mostrar a chave'), type: 'error' }),
  })

  async function keyForCopy() {
    if (revealed) return revealed
    const key = await integrationsService.googleAds.revealKey()
    setRevealed(key)
    return key
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-neutral-600">Chave</p>
      <div className="flex gap-2">
        <input readOnly value={revealed ?? view.keyMasked ?? ''} aria-label="Chave do webhook" className={`${fieldClassName} font-mono`} />
        <button
          type="button"
          onClick={() => (revealed ? setRevealed(null) : reveal.mutate())}
          disabled={reveal.isPending}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60"
        >
          {reveal.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : revealed ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {revealed ? 'Esconder' : 'Mostrar chave'}
        </button>
        <CopyButton getValue={keyForCopy} label="Copiar chave" />
      </div>
    </div>
  )
}

function Distribution({ view, onSaved }: { view: GoogleAdsView; onSaved: (view: GoogleAdsView) => void }) {
  const [draft, setDraft] = useState<IntakeConfig>(view.config)
  const [minutesText, setMinutesText] = useState(String(view.config.firstContactMinutes))

  const { data: users, isLoading } = useQuery<UserOption[]>({
    queryKey: ['users', 'integration-assignees'],
    queryFn: () => usersService.findAll(),
    staleTime: 60_000,
  })
  const brokers = (users ?? []).filter((user) => user.active && user.role === 'corretor')
  const byId = new Map((users ?? []).map((user) => [user.id, user]))
  const selected = draft.assignment.userIds
  const available = brokers.filter((user) => !selected.includes(user.id))

  const minutes = Number(minutesText)
  const minutesValid = Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440

  const save = useMutation({
    mutationFn: () =>
      integrationsService.googleAds.update({
        assignment: { userIds: selected },
        createFirstContactTask: draft.createFirstContactTask,
        firstContactMinutes: minutes,
      }),
    onSuccess: (updated) => {
      onSaved(updated)
      toast.add({ title: 'Distribuição salva', type: 'success' })
    },
    onError: (error) => toast.add({ title: apiMessage(error, 'Não foi possível salvar'), type: 'error' }),
  })

  function toggle(id: string) {
    setDraft((current) => ({
      ...current,
      assignment: {
        userIds: current.assignment.userIds.includes(id)
          ? current.assignment.userIds.filter((item) => item !== id)
          : [...current.assignment.userIds, id],
      },
    }))
  }

  return (
    <>
      <div>
        <p className="mb-1 text-xs font-medium text-neutral-600">Quem recebe estes leads</p>
        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selected.map((id) => (
              <span key={id} className="flex items-center gap-1 rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand">
                {byId.get(id)?.name ?? 'Usuário'}
                <button type="button" onClick={() => toggle(id)} aria-label={`Remover ${byId.get(id)?.name ?? 'usuário'}`} className="rounded-full hover:bg-brand/10">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-10 rounded-[12px]" />
        ) : available.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 rounded-[12px] border-[1.5px] border-neutral-200 bg-white p-2">
            {available.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggle(user.id)}
                className="min-h-8 rounded-full border-[0.5px] border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand"
              >
                {user.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400">Nenhum outro corretor ativo para adicionar.</p>
        )}
        <p className="mt-2 text-xs text-neutral-400">
          Os leads vão para quem recebeu menos nas últimas 24 horas.
          {selected.length === 0 && ' Sem ninguém escolhido, vão para quem ativou a integração.'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label htmlFor="first-contact" className="text-sm text-neutral-900">
          Criar tarefa de primeiro contato
        </label>
        <Switch
          id="first-contact"
          checked={draft.createFirstContactTask}
          onCheckedChange={(checked) => setDraft((current) => ({ ...current, createFirstContactTask: checked }))}
        />
      </div>
      {draft.createFirstContactTask && (
        <div>
          <label htmlFor="first-contact-minutes" className="mb-1 block text-xs font-medium text-neutral-600">
            Prazo da tarefa (minutos)
          </label>
          <input
            id="first-contact-minutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            value={minutesText}
            onChange={(event) => setMinutesText(event.target.value)}
            className="h-10 w-28 rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 text-[16px] text-neutral-900 outline-none focus:border-brand sm:text-sm"
          />
          {!minutesValid && <p className="mt-1 text-xs text-danger">Informe de 1 a 1440 minutos.</p>}
        </div>
      )}

      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending || !minutesValid}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar distribuição
      </button>
    </>
  )
}

export function GoogleAdsPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [confirmDisable, setConfirmDisable] = useState(false)

  const { data: view, isLoading, isError } = useQuery({
    queryKey: GOOGLE_KEY,
    queryFn: integrationsService.googleAds.get,
    enabled: open,
  })

  // Qualquer ação: a resposta já é o estado novo; o resto da tela (catálogo, eventos) é recarregado
  function applied(updated: GoogleAdsView) {
    queryClient.setQueryData(GOOGLE_KEY, updated)
    queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY })
  }

  const enable = useMutation({
    mutationFn: () => integrationsService.googleAds.enable(),
    onSuccess: (updated) => {
      applied(updated)
      toast.add({ title: 'Google Ads ativado', description: 'Agora cole a URL e a chave no Google Ads.', type: 'success' })
    },
    onError: (error) => toast.add({ title: apiMessage(error, 'Não foi possível ativar'), type: 'error' }),
  })

  const disable = useMutation({
    mutationFn: integrationsService.googleAds.disable,
    onSuccess: (updated) => {
      applied(updated)
      setConfirmDisable(false)
      toast.add({ title: 'Google Ads desativado', description: 'A URL e a chave ficam guardadas para quando religar.', type: 'success' })
    },
    onError: (error) => toast.add({ title: apiMessage(error, 'Não foi possível desativar'), type: 'error' }),
  })

  const rotate = useMutation({
    mutationFn: integrationsService.googleAds.rotateKey,
    onSuccess: ({ message, ...updated }) => {
      applied(updated)
      setConfirmRotate(false)
      toast.add({ title: 'Chave nova gerada', description: message, type: 'success' })
    },
    onError: (error) => toast.add({ title: apiMessage(error, 'Não foi possível gerar a chave'), type: 'error' }),
  })

  const enabled = view?.enabled ?? false

  return (
    <PanelShell
      open={open}
      onOpenChange={onOpenChange}
      title="Google Ads"
      description="Os leads dos formulários do Google Ads entram direto no funil, na primeira etapa."
      status={view?.status}
      footer={
        enabled ? (
          <>
            <button
              type="button"
              onClick={() => setConfirmDisable(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-danger hover:bg-danger-bg sm:h-10"
            >
              <Power className="h-4 w-4" />
              Desativar
            </button>
            <button
              type="button"
              onClick={() => setConfirmRotate(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100 sm:h-10"
            >
              <KeyRound className="h-4 w-4" />
              Gerar nova chave
            </button>
          </>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-[12px]" />
          <Skeleton className="h-40 rounded-[12px]" />
        </div>
      ) : isError || !view ? (
        <Notice tone="danger">Não foi possível carregar a integração.</Notice>
      ) : (
        <>
          {!view.publicUrlConfigured && (
            <Notice tone="warning">
              O endereço público do backend (API_PUBLIC_URL) não está configurado no servidor. Sem ele não dá para gerar a URL
              do webhook.
            </Notice>
          )}
          {view.secretsError && <Notice tone="danger">{view.secretsError}</Notice>}
          {view.lastError && view.status === 'erro' && <Notice tone="danger">Último erro: {view.lastError}</Notice>}

          <Step number={1} title="Ativar">
            {enabled ? (
              <p className="text-sm text-neutral-600">Integração ativa.</p>
            ) : (
              <>
                {view.webhookUrl && (
                  <p className="text-sm text-neutral-600">A integração está desligada. Religar mantém a mesma URL e a mesma chave.</p>
                )}
                <button
                  type="button"
                  onClick={() => enable.mutate()}
                  disabled={enable.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  {enable.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Ativar integração
                </button>
              </>
            )}
          </Step>

          <Step number={2} title="Conectar no Google Ads" muted={!enabled}>
            {enabled && view.webhookUrl ? (
              <>
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-600">URL do webhook</p>
                  <div className="flex gap-2">
                    <input readOnly value={view.webhookUrl} aria-label="URL do webhook" className={fieldClassName} />
                    <CopyButton getValue={() => view.webhookUrl ?? ''} label="Copiar URL" />
                  </div>
                </div>
                {/* key: chave nova (rotação) remonta o campo e esconde a que estava aberta */}
                <KeyField key={view.keyMasked ?? 'sem-chave'} view={view} />
                <ol className="list-decimal space-y-1 pl-4 text-sm text-neutral-600">
                  <li>No Google Ads, abra o formulário de lead da sua campanha.</li>
                  <li>Vá em exportar leads, outras opções de integração de dados.</li>
                  <li>Cole a URL e a chave.</li>
                  <li>Clique em enviar dados de teste.</li>
                </ol>
                <p className="text-xs text-neutral-400">Os nomes dos menus podem variar um pouco.</p>
                <Notice tone="warning">Se a chave estiver errada em um dos lados, os leads não chegam e o Google não mostra erro.</Notice>
              </>
            ) : (
              <p className="text-sm text-neutral-400">A URL e a chave aparecem depois de ativar.</p>
            )}
          </Step>

          <Step number={3} title="Distribuição" muted={!enabled}>
            {enabled ? (
              <Distribution key={JSON.stringify(view.config)} view={view} onSaved={applied} />
            ) : (
              <p className="text-sm text-neutral-400">Escolha quem recebe os leads depois de ativar.</p>
            )}
          </Step>

          <Step number={4} title="Atividade">
            <EventsList provider="google_ads" poll={open && enabled} />
          </Step>
        </>
      )}

      <AlertDialog open={confirmRotate} onOpenChange={(value) => !rotate.isPending && setConfirmRotate(value)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Gerar nova chave?</AlertDialogTitle>
            <AlertDialogDescription>
              A chave atual deixa de valer na hora. Os leads só voltam a chegar depois que você colar a chave nova no formulário
              do Google Ads.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:flex-row sm:justify-end sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rotate.mutate()}
              disabled={rotate.isPending}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              {rotate.isPending ? 'Gerando...' : 'Gerar nova chave'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDisable} onOpenChange={(value) => !disable.isPending && setConfirmDisable(value)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Desativar o Google Ads?</AlertDialogTitle>
            <AlertDialogDescription>
              Os leads enviados pelo Google deixam de entrar. A URL, a chave e a distribuição ficam guardadas para quando religar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:flex-row sm:justify-end sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disable.mutate()}
              disabled={disable.isPending}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              {disable.isPending ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PanelShell>
  )
}
