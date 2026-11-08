'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BedDouble,
  Bath,
  Building,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  Copy,
  Lock,
  Maximize,
  Pencil,
  Ruler,
  Share2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { toast } from '@/components/ui/toast'
import { useIsMobile } from '@/lib/use-is-mobile'
import { formatCurrency } from '@/lib/utils'
import { propertySharesService } from '@/services/property-shares.service'
import type { Property, PropertyShare } from '@/types'
import { DEVELOPMENT_STATUS_META, type DevelopmentStatus } from '../constants'
import { PortalChip } from '../portal/portal-chip'
import { portalTypeLabel, usePortalConfig } from '../portal/use-portal-config'
import { PhotoArea, SituationBadge, type Situation } from '../share/photo-area'
import { acceptsLine, formatDate, formatMoney, formatRelative, specItems, type SpecKey } from '../share/share-format'
import { SharePropertyPanel } from '../share/share-property-panel'

const SPEC_ICON: Record<SpecKey, LucideIcon> = {
  livingArea: Ruler,
  lotArea: Maximize,
  bedrooms: BedDouble,
  suites: BedDouble,
  bathrooms: Bath,
  parking: Car,
  floor: Building,
  yearBuilt: CalendarDays,
}

const ADDRESS_MODE_LABEL = { full: 'endereço completo', street: 'só a rua', neighborhood: 'só o bairro' } as const

const SHARE_STATUS_META: Record<PropertyShare['status'], { label: string; bg: string; text: string }> = {
  ativo: { label: 'Ativo', bg: '#E8F5E9', text: '#008A05' },
  expirado: { label: 'Expirado', bg: '#F7F7F7', text: '#484848' },
  revogado: { label: 'Revogado', bg: '#FFEBEE', text: '#D93B30' },
}

export function isPropertySold(property: Property) {
  return property.sold || property.status === 'vendido'
}

function situationOf(property: Property): Situation | null {
  if (isPropertySold(property)) return 'vendido'
  if (property.kind === 'revenda') return property.status === 'reservado' ? 'reservado' : 'disponivel'
  return null
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[15px] font-semibold text-neutral-900">{title}</h3>
      {children}
    </section>
  )
}

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const long = text.length > 280
  return (
    <div>
      <p className={`whitespace-pre-line text-[15px] leading-relaxed text-neutral-600 ${!expanded && long ? 'line-clamp-4' : ''}`}>
        {text}
      </p>
      {long && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-1 min-h-9 text-sm font-medium text-brand">
          {expanded ? 'Ler menos' : 'Ler mais'}
        </button>
      )}
    </div>
  )
}

function SharesList({ property }: { property: Property }) {
  const queryClient = useQueryClient()
  const [revoking, setRevoking] = useState<PropertyShare | null>(null)
  const { data: shares, isLoading } = useQuery({
    queryKey: ['property-shares', property.id],
    queryFn: () => propertySharesService.list(property.id),
    meta: { silent: true },
  })

  const revoke = useMutation({
    mutationFn: (id: string) => propertySharesService.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-shares', property.id] })
      toast.add({ title: 'Link revogado. Quem abrir verá “Link inválido”.', type: 'success' })
    },
    onError: () => toast.add({ title: 'Não foi possível revogar', type: 'error' }),
  })

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.add({ title: 'Link copiado', type: 'success' })
    } catch {
      toast.add({ title: 'Não foi possível copiar', type: 'error' })
    }
  }

  if (isLoading) return <p className="text-sm text-neutral-400">Carregando…</p>
  if (!shares || shares.length === 0) {
    return <p className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-400">Você ainda não compartilhou este imóvel</p>
  }

  return (
    <>
      <ul className="divide-y-[0.5px] divide-neutral-200 rounded-[12px] border-[0.5px] border-neutral-200">
        {shares.map((share) => {
          const status = SHARE_STATUS_META[share.status]
          return (
            <li key={share.id} className="space-y-1.5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-900">{share.leadName ?? 'Link geral'}</span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: status.bg, color: status.text }}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {share.sentAt ? `Enviado em ${formatDate(share.sentAt)}` : 'Não enviado'}
                {' · '}
                {share.viewCount === 0
                  ? 'Ainda não visto'
                  : `${share.viewCount} ${share.viewCount === 1 ? 'visualização' : 'visualizações'}`}
                {share.lastViewedAt ? ` · última ${formatRelative(share.lastViewedAt)}` : ''}
              </p>
              {share.status === 'ativo' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void copyLink(share.url)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 px-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar link
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevoking(share)}
                    className="inline-flex min-h-9 items-center rounded-[8px] px-2.5 text-xs font-medium text-danger hover:bg-[#FFEBEE]"
                  >
                    Revogar
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <AlertDialog open={revoking !== null} onOpenChange={(open: boolean) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar este link?</AlertDialogTitle>
            <AlertDialogDescription>
              {revoking?.leadName ? `${revoking.leadName} não` : 'Ninguém'} vai conseguir abrir o imóvel por ele. Não dá para
              desfazer: para enviar de novo, gere outro link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (revoking) revoke.mutate(revoking.id)
                setRevoking(null)
              }}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function PrivateBlock({ property }: { property: Property }) {
  const [open, setOpen] = useState(false)
  const rows: { label: string; value: ReactNode }[] = []
  if (property.sellerLeadId) {
    rows.push({
      label: 'Proprietário',
      value: (
        <Link href={`/leads/${property.sellerLeadId}`} className="font-medium text-brand hover:underline">
          {property.sellerLeadName ?? 'Ver lead'}
        </Link>
      ),
    })
  }
  if (property.exclusive) rows.push({ label: 'Exclusividade', value: 'Sim' })
  if (property.commissionPct !== undefined) {
    rows.push({ label: 'Comissão', value: `${property.commissionPct.toLocaleString('pt-BR')}%` })
  }
  if (property.minIncome !== undefined || property.maxIncome !== undefined) {
    const min = property.minIncome !== undefined ? formatCurrency(property.minIncome) : '—'
    const max = property.maxIncome !== undefined ? formatCurrency(property.maxIncome) : '—'
    rows.push({ label: 'Renda ideal', value: `${min} a ${max}` })
  }
  if (property.internalNotes) {
    rows.push({ label: 'Observações internas', value: <span className="whitespace-pre-line">{property.internalNotes}</span> })
  }

  return (
    <section className="rounded-[16px] border-[0.5px] border-dashed border-neutral-400 bg-neutral-100">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Lock className="h-4 w-4 text-neutral-400" />
          Só você vê
        </span>
        <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-4">
          <p className="text-xs text-neutral-400">Nunca vai para o link nem para os portais.</p>
          {rows.length === 0 ? (
            <p className="text-sm text-neutral-400">Nada cadastrado.</p>
          ) : (
            <dl className="space-y-2">
              {rows.map((row) => (
                <div key={row.label} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                  <dt className="text-neutral-400">{row.label}</dt>
                  <dd className="text-neutral-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </section>
  )
}

function ViewerBody({ property, onOpenPortal }: { property: Property; onOpenPortal: () => void }) {
  const { data: config } = usePortalConfig()
  const isDevelopment = property.kind === 'empreendimento'
  const situation = situationOf(property)
  const typeLabel = isDevelopment ? 'Empreendimento' : (portalTypeLabel(config, property.propertyType) ?? 'Imóvel de revenda')

  const specs = specItems({
    livingArea: property.areaM2,
    lotArea: property.lotAreaM2,
    bedrooms: property.bedrooms,
    suites: property.suites,
    bathrooms: property.bathrooms,
    parking: property.parkingSpots,
    unitFloor: property.unitFloor,
    buildingFloors: property.buildingFloors,
    yearBuilt: property.yearBuilt,
  })
  const developmentStatus = isDevelopment ? DEVELOPMENT_STATUS_META[property.status as DevelopmentStatus] : undefined

  const fullAddress = [
    [property.address, property.streetNumber].filter(Boolean).join(', '),
    property.complement,
    property.neighborhood,
    [property.city, property.state].filter(Boolean).join(' - '),
    property.cep,
  ]
    .filter(Boolean)
    .join(' · ')

  const featureLabels = (property.features ?? []).map(
    (value) => config?.features.find((feature) => feature.value === value)?.label ?? value,
  )
  const accepts = acceptsLine(property.acceptsFgts, property.acceptsFinancing)
  const conditions: { label: string; value: string }[] = []
  if (property.condoFee) conditions.push({ label: 'Condomínio', value: `${formatMoney(property.condoFee)}/mês` })
  if (property.iptuValue) {
    const period = property.iptuPeriod === 'mensal' ? '/mês' : property.iptuPeriod === 'anual' ? '/ano' : ''
    conditions.push({ label: 'IPTU', value: `${formatMoney(property.iptuValue)}${period}` })
  }

  return (
    <div className="space-y-6">
      <PhotoArea
        photos={[]}
        kind={isDevelopment ? 'empreendimento' : 'revenda'}
        title={property.title}
        badge={situation ? <SituationBadge situation={situation} /> : undefined}
        className="-mx-4 -mt-4 h-52 sm:mx-0 sm:mt-0 sm:h-64 sm:rounded-[16px]"
      />

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{typeLabel}</p>
        <h2 className="text-[22px] font-semibold leading-tight text-neutral-900">{property.title}</h2>
        {isDevelopment ? (
          <div className="text-brand">
            {property.startingPrice !== undefined && (
              <p className="text-[26px] font-semibold leading-tight">a partir de {formatMoney(property.startingPrice)}</p>
            )}
            {property.maxPrice !== undefined && <p className="text-sm font-medium">até {formatMoney(property.maxPrice)}</p>}
          </div>
        ) : (
          property.price !== undefined && (
            <p className="text-[28px] font-semibold leading-tight text-brand">{formatMoney(property.price)}</p>
          )
        )}
        <div className="text-sm text-neutral-600">
          <p>{fullAddress || property.city}</p>
          {!isDevelopment && (
            <p className="mt-0.5 text-xs text-neutral-400">
              Nos portais e no link, aparece: {ADDRESS_MODE_LABEL[property.portalAddressDisplay ?? 'street']}
            </p>
          )}
        </div>
        {!isDevelopment && <PortalChip property={property} onOpen={onOpenPortal} />}
      </header>

      {(specs.length > 0 || isDevelopment) && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {isDevelopment && property.totalUnits !== undefined && (
            <li className="flex items-center gap-2 rounded-[12px] bg-neutral-100 px-3 py-2.5 text-sm text-neutral-900">
              <Building className="h-4 w-4 shrink-0 text-neutral-400" />
              {property.totalUnits} unidades
            </li>
          )}
          {developmentStatus && (
            <li className="flex items-center gap-2 rounded-[12px] bg-neutral-100 px-3 py-2.5 text-sm text-neutral-900">
              <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" />
              {developmentStatus.label}
            </li>
          )}
          {specs.map((spec) => {
            const Icon = SPEC_ICON[spec.key]
            return (
              <li key={spec.key} className="flex items-center gap-2 rounded-[12px] bg-neutral-100 px-3 py-2.5 text-sm text-neutral-900">
                <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
                {spec.value}
              </li>
            )
          })}
        </ul>
      )}

      {(conditions.length > 0 || accepts) && (
        <Section title="Condições">
          <ul className="space-y-1.5 text-sm">
            {conditions.map((condition) => (
              <li key={condition.label} className="flex justify-between gap-3">
                <span className="text-neutral-400">{condition.label}</span>
                <span className="font-medium text-neutral-900">{condition.value}</span>
              </li>
            ))}
            {property.acceptsFgts && (
              <li className="flex items-center gap-1.5 text-neutral-900">
                <Check className="h-4 w-4 text-success" /> Aceita FGTS
              </li>
            )}
            {property.acceptsFinancing && (
              <li className="flex items-center gap-1.5 text-neutral-900">
                <Check className="h-4 w-4 text-success" /> Aceita financiamento
              </li>
            )}
          </ul>
        </Section>
      )}

      {featureLabels.length > 0 && (
        <Section title="Características">
          <ul className="flex flex-wrap gap-1.5">
            {featureLabels.map((label) => (
              <li key={label} className="inline-flex items-center gap-1 rounded-full bg-brand-bg px-3 py-1 text-[13px] font-medium text-brand">
                <Sparkles className="h-3 w-3" />
                {label}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {property.description && (
        <Section title="Descrição">
          <Description text={property.description} />
        </Section>
      )}

      <PrivateBlock property={property} />

      <Section title="Quem já recebeu este imóvel">
        <SharesList property={property} />
      </Section>
    </div>
  )
}

function ViewerFooter({
  property,
  onShare,
  onEdit,
  onClose,
}: {
  property: Property
  onShare: () => void
  onEdit: () => void
  onClose: () => void
}) {
  const sold = isPropertySold(property)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onShare}
          disabled={sold}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[8px] border-[1.5px] border-neutral-900 px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-[8px] border-[0.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Fechar
        </button>
      </div>
      {sold && <p className="text-center text-xs text-neutral-400">Imóvel vendido: não pode ser compartilhado</p>}
    </div>
  )
}

/** "Ver imóvel": Dialog max-w-2xl no desktop, Sheet em tela cheia com rodapé fixo no celular */
export function PropertyViewer({
  property,
  open,
  onOpenChange,
  onEdit,
}: {
  property: Property | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  /** tab: aba do cadastro de revenda (3 = portais) */
  onEdit: (property: Property, tab?: number) => void
}) {
  const isMobile = useIsMobile()
  const [sharing, setSharing] = useState(false)
  if (!property) return null

  const body = open && <ViewerBody property={property} onOpenPortal={() => onEdit(property, 3)} />
  const footer = (
    <ViewerFooter
      property={property}
      onShare={() => setSharing(true)}
      onEdit={() => onEdit(property)}
      onClose={() => onOpenChange(false)}
    />
  )

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="flex h-[100dvh] max-h-[100dvh] flex-col gap-0 rounded-none bg-white p-0">
            <SheetTitle className="sr-only">{property.title}</SheetTitle>
            <div className="flex-1 overflow-y-auto p-4">{body}</div>
            <div className="shrink-0 border-t-[0.5px] border-neutral-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0 sm:max-w-2xl">
            <DialogTitle className="sr-only">{property.title}</DialogTitle>
            <div className="flex-1 overflow-y-auto p-6">{body}</div>
            <div className="shrink-0 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4">{footer}</div>
          </DialogContent>
        </Dialog>
      )}
      <SharePropertyPanel open={sharing} onOpenChange={setSharing} property={property} />
    </>
  )
}

