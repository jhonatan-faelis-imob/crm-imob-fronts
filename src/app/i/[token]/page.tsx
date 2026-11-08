import { CircleAlert, Clock, HousePlus } from 'lucide-react'
import type { Metadata } from 'next'
import { loadPublicShare, priceText, summaryText } from '@/features/vitrine/load-share'
import { PublicPropertyView, ShareStateScreen } from '@/features/vitrine/public-property-view'
import { ViewTracker } from '@/features/vitrine/view-tracker'

type Params = { params: Promise<{ token: string }> }

// O link não pode ser indexado, e o token não pode vazar no Referer (ex.: ao abrir o wa.me)
const PRIVATE: Pick<Metadata, 'robots' | 'referrer'> = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params
  const result = await loadPublicShare(token)

  if (result.kind !== 'ok') {
    const title = result.kind === 'expired' ? 'Link expirado' : 'Link inválido'
    return { ...PRIVATE, title }
  }
  if (result.share.status === 'indisponivel') return { ...PRIVATE, title: 'Imóvel indisponível' }

  const share = result.share
  const price = priceText(share)
  const title = price ? `${share.title} · ${price}` : share.title
  const description = summaryText(share)
  return {
    ...PRIVATE,
    title,
    description,
    openGraph: { type: 'website', locale: 'pt_BR', title, description, siteName: share.organization.name },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PublicSharePage({ params }: Params) {
  const { token } = await params
  const result = await loadPublicShare(token)

  if (result.kind === 'expired') {
    return (
      <ShareStateScreen
        icon={<Clock className="h-9 w-9" />}
        title="Este link expirou"
        text="Este link expirou. Peça um novo ao seu corretor."
      />
    )
  }
  if (result.kind !== 'ok') {
    return (
      <ShareStateScreen
        icon={<CircleAlert className="h-9 w-9" />}
        title="Link inválido"
        text={
          result.kind === 'error'
            ? 'Não conseguimos carregar este imóvel agora. Tente de novo em instantes.'
            : 'Este link não existe ou foi desativado. Peça um novo ao seu corretor.'
        }
      />
    )
  }

  const share = result.share
  if (share.status === 'indisponivel') {
    return (
      <>
        <ViewTracker token={token} />
        <ShareStateScreen
          icon={<HousePlus className="h-9 w-9" />}
          title="Imóvel indisponível"
          text="Este imóvel não está mais disponível. Fale com seu corretor."
          broker={share.broker}
          organization={share.organization.name}
        />
      </>
    )
  }

  return (
    <>
      <ViewTracker token={token} />
      <PublicPropertyView share={share} />
    </>
  )
}
