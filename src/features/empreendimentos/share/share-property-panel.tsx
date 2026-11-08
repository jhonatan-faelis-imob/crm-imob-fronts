'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Copy, ExternalLink, Link2, Loader2, MessageCircle, Search, Share2, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { IMaskInput } from 'react-imask'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/toast'
import { phoneMask } from '@/features/leads/lead-form/masks'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { useIsMobile } from '@/lib/use-is-mobile'
import { whatsappUrl } from '@/lib/whatsapp'
import { authService } from '@/services/auth.service'
import { leadsService } from '@/services/leads.service'
import { propertySharesService } from '@/services/property-shares.service'
import type { Property } from '@/types'
import { apiErrorDetails } from '../portal/use-portal-config'
import { buildPropertyShareMessage } from './share-message'

type Recipient = 'lead' | 'phone' | 'link'

interface LeadOption {
  id: string
  name: string
  phone: string
  phone2: string | null
}

const inputClassName =
  'w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-[16px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand'

const RECIPIENTS: { value: Recipient; label: string }[] = [
  { value: 'lead', label: 'Lead do CRM' },
  { value: 'phone', label: 'Outro número' },
  { value: 'link', label: 'Só gerar o link' },
]

function digits(value: string) {
  return value.replace(/\D/g, '')
}

function LeadSearch({ onSelect }: { onSelect: (lead: LeadOption) => void }) {
  const [term, setTerm] = useState('')
  const search = useDebouncedValue(term.trim(), 300)
  const enabled = search.length >= 2
  const { data, isFetching } = useQuery<{ data: LeadOption[] }>({
    queryKey: ['leads', 'share-search', search],
    queryFn: () => leadsService.findAll({ search, limit: '8' }),
    enabled,
    staleTime: 30_000,
    meta: { silent: true },
  })
  const results = enabled ? (data?.data ?? []) : []

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Buscar pelo nome ou telefone"
        aria-label="Buscar lead"
        autoComplete="off"
        className={`${inputClassName} pl-9`}
      />
      {isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />}
      {enabled && !isFetching && (
        <div className="mt-1 max-h-56 overflow-y-auto rounded-[12px] border-[0.5px] border-neutral-200 bg-white p-1">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-neutral-400">Nenhum lead encontrado</p>
          ) : (
            results.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => onSelect(lead)}
                className="flex min-h-11 w-full flex-col items-start justify-center rounded-[8px] px-3 py-1.5 text-left hover:bg-neutral-100"
              >
                <span className="text-sm font-medium text-neutral-900">{lead.name}</span>
                <span className="text-xs text-neutral-400">{lead.phone}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function PanelBody({ property, onDone }: { property: Property; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [recipient, setRecipient] = useState<Recipient>('lead')
  const [lead, setLead] = useState<LeadOption | null>(null)
  const [usePhone2, setUsePhone2] = useState(false)
  const [otherPhone, setOtherPhone] = useState('')
  const [showPrice, setShowPrice] = useState(true)
  const [linkToLead, setLinkToLead] = useState(true)
  // null = mensagem automática; ao editar, vale o texto do usuário até trocar lead ou valor
  const [editedMessage, setEditedMessage] = useState<string | null>(null)

  const leadId = recipient === 'lead' ? lead?.id : undefined
  const waitingLead = recipient === 'lead' && !lead

  // O link é criado (ou reaproveitado) já ao abrir e ao trocar lead/valor: assim o clique em
  // "Abrir no WhatsApp" abre a janela na hora, de forma síncrona, sem ser bloqueado como pop-up
  const link = useQuery({
    queryKey: ['property-share-link', property.id, leadId ?? 'geral', showPrice],
    queryFn: () => propertySharesService.create({ propertyId: property.id, leadId, showPrice }),
    enabled: !waitingLead,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    meta: { silent: true },
  })
  const share = link.data

  const { data: me } = useQuery<{ phone: string | null }>({
    queryKey: ['auth-me'],
    queryFn: () => authService.me(),
    staleTime: 5 * 60_000,
    meta: { silent: true },
  })
  const missingBrokerPhone = me !== undefined && !me.phone?.trim()

  const isDevelopment = property.kind === 'empreendimento'
  const generatedMessage = share
    ? buildPropertyShareMessage({
        leadName: recipient === 'lead' ? lead?.name : null,
        kind: isDevelopment ? 'empreendimento' : 'revenda',
        title: property.title,
        code: property.code,
        neighborhood: property.neighborhood,
        city: property.city,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpots: property.parkingSpots,
        area: property.areaM2 ?? property.lotAreaM2,
        price: isDevelopment ? property.startingPrice : property.price,
        showPrice,
        acceptsFgts: property.acceptsFgts,
        acceptsFinancing: property.acceptsFinancing,
        url: share.url,
      })
    : ''
  const message = editedMessage ?? generatedMessage

  const phone =
    recipient === 'lead' && lead
      ? usePhone2 && lead.phone2
        ? lead.phone2
        : lead.phone
      : recipient === 'phone'
        ? otherPhone
        : ''
  const phoneOk = digits(phone).length >= 10
  const canUseLink = share !== undefined && !link.isFetching
  const canWhatsapp = canUseLink && recipient !== 'link' && phoneOk
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['property-shares', property.id] })
    queryClient.invalidateQueries({ queryKey: ['properties'] })
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['goals-auto-fill'] })
    if (share && leadId) queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
  }

  const markSent = useMutation({
    mutationFn: ({ channel }: { channel: 'whatsapp' | 'link' }) =>
      propertySharesService.markSent(share?.id ?? '', channel, leadId ? linkToLead : undefined),
    onSettled: invalidate,
  })

  function resetMessage() {
    setEditedMessage(null)
  }

  function openWhatsapp() {
    if (!canWhatsapp || !share) return
    // Síncrono, no clique: o navegador do celular não bloqueia
    window.open(whatsappUrl(phone, message), '_blank', 'noopener,noreferrer')
    markSent.mutate(
      { channel: 'whatsapp' },
      {
        onSuccess: (result) =>
          toast.add({
            title: result.interactionCreated ? 'WhatsApp aberto. Interação registrada.' : 'WhatsApp aberto.',
            type: 'success',
          }),
        onError: (error) =>
          toast.add({ title: 'Não foi possível registrar o envio', description: apiErrorDetails(error).message, type: 'error' }),
      },
    )
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.add({ title: `${label} copiado`, type: 'success' })
      markSent.mutate({ channel: 'link' })
    } catch {
      toast.add({ title: 'Não foi possível copiar', type: 'error' })
    }
  }

  async function nativeShare() {
    if (!share) return
    try {
      await navigator.share({ title: property.title, text: message })
      markSent.mutate({ channel: 'link' })
    } catch {
      // Cancelado pelo usuário: nada a fazer
    }
  }

  return (
    <div className="space-y-5">
      {missingBrokerPhone && (
        <p className="flex gap-2 rounded-[12px] bg-[#FFF7E0] p-3 text-sm text-[#B45309]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Seu telefone não está cadastrado, e o cliente não verá o botão de contato. Peça a um gerente para preencher em
          Equipe.
        </p>
      )}

      <section className="space-y-2">
        <p className="text-[13px] font-medium text-neutral-900">Para quem</p>
        <div role="radiogroup" aria-label="Para quem" className="grid grid-cols-3 gap-1.5">
          {RECIPIENTS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={recipient === option.value}
              onClick={() => {
                setRecipient(option.value)
                resetMessage()
              }}
              className={`min-h-11 rounded-[8px] border-[1.5px] px-2 text-[13px] font-medium transition-colors ${
                recipient === option.value
                  ? 'border-brand bg-brand-bg text-brand'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {recipient === 'lead' &&
          (lead ? (
            <div className="space-y-2 rounded-[12px] border-[1.5px] border-neutral-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-neutral-900">
                  <UserRound className="h-4 w-4 shrink-0 text-neutral-400" />
                  <span className="truncate">{lead.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLead(null)
                    setUsePhone2(false)
                    resetMessage()
                  }}
                  aria-label="Trocar lead"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-neutral-400 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {lead.phone2 ? (
                <div role="radiogroup" aria-label="Número" className="flex flex-wrap gap-1.5">
                  {[
                    { second: false, label: `Principal · ${lead.phone}` },
                    { second: true, label: `Segundo · ${lead.phone2}` },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={usePhone2 === option.second}
                      onClick={() => setUsePhone2(option.second)}
                      className={`min-h-10 rounded-[8px] border-[1.5px] px-3 text-[13px] ${
                        usePhone2 === option.second ? 'border-brand text-brand' : 'border-neutral-200 text-neutral-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400">{lead.phone}</p>
              )}
              <label className="flex min-h-10 items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={linkToLead}
                  onChange={(event) => setLinkToLead(event.target.checked)}
                  className="h-4 w-4 accent-[#FF385C]"
                />
                Vincular este imóvel ao lead
              </label>
            </div>
          ) : (
            <LeadSearch
              onSelect={(option) => {
                setLead(option)
                setUsePhone2(false)
                resetMessage()
              }}
            />
          ))}

        {recipient === 'phone' && (
          <IMaskInput
            {...phoneMask}
            value={otherPhone}
            onAccept={(value: string) => setOtherPhone(value)}
            inputMode="tel"
            placeholder="(00) 00000-0000"
            aria-label="Número do WhatsApp"
            className={inputClassName}
          />
        )}
      </section>

      <label className="flex min-h-11 items-center justify-between gap-3 rounded-[12px] border-[0.5px] border-neutral-200 px-3">
        <span className="text-sm font-medium text-neutral-900">Mostrar valor</span>
        <Switch
          checked={showPrice}
          onCheckedChange={(checked: boolean) => {
            setShowPrice(checked)
            resetMessage()
          }}
          aria-label="Mostrar valor na página e na mensagem"
        />
      </label>

      <section className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="share-message" className="text-[13px] font-medium text-neutral-900">
            Mensagem
          </label>
          {editedMessage !== null && (
            <button type="button" onClick={resetMessage} className="text-xs font-medium text-brand">
              Restaurar
            </button>
          )}
        </div>
        {waitingLead ? (
          <p className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-400">Escolha o lead para montar a mensagem.</p>
        ) : link.isError ? (
          <p className="rounded-[12px] bg-[#FFEBEE] p-3 text-sm text-danger">
            {apiErrorDetails(link.error).message ?? 'Não foi possível gerar o link.'}
          </p>
        ) : (
          <textarea
            id="share-message"
            rows={11}
            value={message}
            disabled={!share}
            placeholder={share ? undefined : 'Gerando o link…'}
            onChange={(event) => setEditedMessage(event.target.value)}
            className={`${inputClassName} font-[inherit] text-[15px] leading-relaxed disabled:bg-neutral-100`}
          />
        )}
      </section>

      <section className="space-y-2">
        <button
          type="button"
          onClick={openWhatsapp}
          disabled={!canWhatsapp}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#25D366] px-4 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {link.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
          Abrir no WhatsApp
        </button>
        {recipient === 'phone' && otherPhone && !phoneOk && (
          <p className="text-xs text-neutral-400">Informe o número com DDD.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {canNativeShare && (
            <button
              type="button"
              onClick={() => void nativeShare()}
              disabled={!canUseLink}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-900 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar…
            </button>
          )}
          <button
            type="button"
            onClick={() => share && void copy(share.url, 'Link')}
            disabled={!canUseLink}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            <Link2 className="h-4 w-4" />
            Copiar link
          </button>
          <button
            type="button"
            onClick={() => void copy(message, 'Mensagem')}
            disabled={!canUseLink}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            Copiar mensagem
          </button>
          <button
            type="button"
            onClick={() => share && window.open(`/i/${share.token}`, '_blank', 'noopener,noreferrer')}
            disabled={!canUseLink}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            <ExternalLink className="h-4 w-4" />
            Pré-visualizar página
          </button>
        </div>
        {share?.expiresAt && (
          <p className="text-center text-xs text-neutral-400">
            Link válido até {new Date(share.expiresAt).toLocaleDateString('pt-BR')}
          </p>
        )}
      </section>

      <button type="button" onClick={onDone} className="min-h-11 w-full text-sm font-medium text-neutral-600">
        Concluir
      </button>
    </div>
  )
}

// Dialog no desktop, Sheet inferior no celular
export function SharePropertyPanel({
  open,
  onOpenChange,
  property,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property
}) {
  const isMobile = useIsMobile()
  const title = 'Compartilhar imóvel'
  const description = property.title
  const body = open && <PanelBody property={property} onDone={() => onOpenChange(false)} />

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92dvh] gap-0 overflow-y-auto rounded-t-2xl bg-white p-0">
          <SheetHeader className="sticky top-0 z-10 border-b-[0.5px] border-neutral-200 bg-white p-4 pr-12">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription className="truncate">{description}</SheetDescription>
          </SheetHeader>
          <div className="p-4">{body}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white p-5 ring-0 sm:max-w-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="truncate">{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}
