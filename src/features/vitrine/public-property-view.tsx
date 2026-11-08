import {
  Bath,
  BedDouble,
  Building,
  CalendarDays,
  Car,
  Check,
  HardHat,
  MapPin,
  Maximize,
  MessageCircle,
  Ruler,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { PhotoArea, SituationBadge } from '@/features/empreendimentos/share/photo-area'
import { formatMoney, type SpecKey } from '@/features/empreendimentos/share/share-format'
import { whatsappUrl } from '@/lib/whatsapp'
import type { PublicPropertyShare, PublicShareBroker } from '@/types'
import { placeText, priceText, publicSpecs } from './load-share'
import { ReadMore } from './read-more'

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

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function contactUrl(broker: PublicShareBroker, title: string) {
  if (!broker.phone) return null
  return whatsappUrl(broker.phone, `Olá! Vi o imóvel ${title} e gostaria de mais informações.`)
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-[20px] border-[0.5px] border-neutral-200 bg-white p-5 sm:p-7">
      <h2 className="text-[20px] font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  )
}

export function WhatsappButton({ href, className = '' }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-[#25D366] px-5 text-[16px] font-semibold text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      Chamar no WhatsApp
    </a>
  )
}

function BrokerCard({ broker, organization, title }: { broker: PublicShareBroker; organization: string; title: string }) {
  const href = contactUrl(broker, title)
  return (
    <section className="rounded-[20px] border-[0.5px] border-neutral-200 bg-white p-5 sm:p-7">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">Seu corretor</p>
      <div className="mt-4 flex items-center gap-4">
        {broker.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar externo
          <img src={broker.avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-bg text-xl font-semibold text-brand">
            {initials(broker.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[18px] font-semibold text-neutral-900">{broker.name}</p>
          {broker.creci && <p className="text-sm text-neutral-600">CRECI {broker.creci}</p>}
          <p className="text-sm text-neutral-400">{organization}</p>
        </div>
      </div>
      {href && <WhatsappButton href={href} className="mt-5 hidden w-full sm:flex" />}
    </section>
  )
}

export function PublicPropertyView({ share }: { share: PublicPropertyShare }) {
  const price = priceText(share)
  const place = placeText(share)
  const specs = publicSpecs(share)
  const contact = share.broker ? contactUrl(share.broker, share.title) : null
  const situation = share.status
  const { conditions } = share

  const conditionRows: { label: string; value: string }[] = []
  if (conditions.condoFee) conditionRows.push({ label: 'Condomínio', value: `${formatMoney(conditions.condoFee)}/mês` })
  if (conditions.iptu) {
    const period = conditions.iptu.period === 'mensal' ? '/mês' : conditions.iptu.period === 'anual' ? '/ano' : ''
    conditionRows.push({ label: 'IPTU', value: `${formatMoney(conditions.iptu.value)}${period}` })
  }
  const hasConditions = conditionRows.length > 0 || conditions.acceptsFgts || conditions.acceptsFinancing

  return (
    <div className={contact ? 'pb-28 sm:pb-0' : undefined}>
      <PhotoArea
        photos={share.photos}
        kind={share.kind}
        title={share.title}
        badge={situation !== 'disponivel' ? <SituationBadge situation={situation} large /> : undefined}
        className="h-72 sm:mx-auto sm:mt-6 sm:h-[420px] sm:max-w-3xl sm:rounded-[24px]"
      />

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-0 sm:py-8">
        <header className="space-y-3">
          {share.typeLabel && (
            <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{share.typeLabel}</p>
          )}
          <h1 className="text-[28px] font-semibold leading-tight text-neutral-900 sm:text-[36px]">{share.title}</h1>

          {situation === 'vendido' && (
            <p className="rounded-[12px] bg-[#FFEBEE] px-4 py-3 text-[15px] font-semibold text-[#D93B30]">
              Este imóvel foi vendido. Fale com o corretor sobre opções parecidas.
            </p>
          )}
          {situation === 'reservado' && (
            <p className="rounded-[12px] bg-[#FFF3E0] px-4 py-3 text-[15px] font-semibold text-[#C45800]">
              Imóvel reservado no momento.
            </p>
          )}

          <div>
            {price ? (
              <>
                <p className="text-[32px] font-semibold leading-tight text-brand sm:text-[40px]">{price}</p>
                {share.maxPrice !== null && <p className="text-[15px] font-medium text-brand">até {formatMoney(share.maxPrice)}</p>}
              </>
            ) : (
              <p className="text-[24px] font-semibold text-neutral-900">Consulte valores</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px] text-neutral-600">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
              {[share.location.line, place, share.location.state].filter(Boolean).join(' · ')}
            </span>
            <a
              href={share.location.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 content-center text-[15px] font-semibold text-brand underline-offset-2 hover:underline"
            >
              Ver no mapa
            </a>
          </div>
        </header>

        {(specs.length > 0 || share.kind === 'empreendimento') && (
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {share.totalUnits !== null && (
              <li className="flex items-center gap-2.5 rounded-[16px] bg-white px-4 py-3.5 text-[15px] font-medium text-neutral-900 border-[0.5px] border-neutral-200">
                <Building className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                {share.totalUnits} unidades
              </li>
            )}
            {share.constructionStatusLabel && (
              <li className="flex items-center gap-2.5 rounded-[16px] bg-white px-4 py-3.5 text-[15px] font-medium text-neutral-900 border-[0.5px] border-neutral-200">
                <HardHat className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                {share.constructionStatusLabel}
              </li>
            )}
            {specs.map((spec) => {
              const Icon = SPEC_ICON[spec.key]
              return (
                <li
                  key={spec.key}
                  className="flex items-center gap-2.5 rounded-[16px] border-[0.5px] border-neutral-200 bg-white px-4 py-3.5 text-[15px] font-medium text-neutral-900"
                >
                  <Icon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                  {spec.value}
                </li>
              )
            })}
          </ul>
        )}

        {hasConditions && (
          <Card title="Condições">
            <ul className="space-y-2.5 text-[16px]">
              {conditionRows.map((row) => (
                <li key={row.label} className="flex justify-between gap-4">
                  <span className="text-neutral-600">{row.label}</span>
                  <span className="font-semibold text-neutral-900">{row.value}</span>
                </li>
              ))}
              {conditions.acceptsFgts && (
                <li className="flex items-center gap-2 text-neutral-900">
                  <Check className="h-5 w-5 text-success" aria-hidden="true" /> Aceita FGTS
                </li>
              )}
              {conditions.acceptsFinancing && (
                <li className="flex items-center gap-2 text-neutral-900">
                  <Check className="h-5 w-5 text-success" aria-hidden="true" /> Aceita financiamento
                </li>
              )}
            </ul>
          </Card>
        )}

        {share.features.length > 0 && (
          <Card title="Características">
            <ul className="flex flex-wrap gap-2">
              {share.features.map((feature) => (
                <li key={feature.value} className="rounded-full bg-brand-bg px-3.5 py-1.5 text-[14px] font-medium text-brand">
                  {feature.label}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {share.description && (
          <Card title="Sobre o imóvel">
            <ReadMore text={share.description} />
          </Card>
        )}

        {share.broker && <BrokerCard broker={share.broker} organization={share.organization.name} title={share.title} />}

        <footer className="space-y-1.5 px-1 pt-4 text-center text-[13px] leading-relaxed text-neutral-400">
          <p>Valores e condições sujeitos a alteração e confirmação. Imagens meramente ilustrativas.</p>
          <p>
            Apresentação enviada por {share.broker?.name ?? 'seu corretor'} · {share.organization.name}
          </p>
        </footer>
      </main>

      {contact && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t-[0.5px] border-neutral-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
          <WhatsappButton href={contact} className="w-full" />
        </div>
      )}
    </div>
  )
}

/** Tela de estado (link inválido, expirado, indisponível) */
export function ShareStateScreen({
  icon,
  title,
  text,
  broker,
  organization,
}: {
  icon: ReactNode
  title: string
  text: string
  broker?: PublicShareBroker | null
  organization?: string
}) {
  const href = broker?.phone ? whatsappUrl(broker.phone, 'Olá! Recebi um link de imóvel que não está mais disponível.') : null
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-bg text-brand">{icon}</div>
      <h1 className="mt-6 text-[26px] font-semibold text-neutral-900">{title}</h1>
      <p className="mt-2 max-w-sm text-[17px] leading-relaxed text-neutral-600">{text}</p>
      {broker && (
        <p className="mt-6 text-[15px] text-neutral-600">
          {broker.name}
          {organization ? ` · ${organization}` : ''}
        </p>
      )}
      {href && <WhatsappButton href={href} className="mt-4" />}
    </main>
  )
}
