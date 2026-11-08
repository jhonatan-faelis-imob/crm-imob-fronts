import { ImageResponse } from 'next/og'
import { loadPublicShare, placeText, priceText, publicSpecs } from '@/features/vitrine/load-share'

// Cartão de prévia do link (WhatsApp, iMessage...): faixa coral, título, valor, localização e especificações
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Imóvel'

const CORAL = '#FF385C'

function Fallback({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#F7F5F3' }}>
      <div style={{ display: 'flex', height: 28, background: CORAL }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '0 80px' }}>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, color: '#222222' }}>{title}</div>
        <div style={{ display: 'flex', marginTop: 16, fontSize: 32, color: '#484848' }}>{subtitle}</div>
      </div>
    </div>
  )
}

export default async function OpengraphImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await loadPublicShare(token)

  if (result.kind !== 'ok' || result.share.status === 'indisponivel') {
    return new ImageResponse(<Fallback title="Imóvel" subtitle="Fale com seu corretor" />, size)
  }

  const share = result.share
  const price = priceText(share) ?? 'Consulte valores'
  const place = [placeText(share), share.location.state].filter(Boolean).join(' · ')
  const specs = publicSpecs(share)
    .filter((spec) => ['livingArea', 'lotArea', 'bedrooms', 'bathrooms', 'parking'].includes(spec.key))
    .slice(0, 4)
  const photo = share.photos[0]
  const title = share.title.length > 70 ? `${share.title.slice(0, 67)}...` : share.title

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#F7F5F3' }}>
        <div style={{ display: 'flex', width: 28, background: CORAL }} />
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 600, color: CORAL }}>
              {share.typeLabel ?? 'Imóvel'}
              {share.status !== 'disponivel' ? ` · ${share.status === 'vendido' ? 'Vendido' : 'Reservado'}` : ''}
            </div>
            <div style={{ display: 'flex', marginTop: 18, fontSize: 60, fontWeight: 700, lineHeight: 1.1, color: '#222222' }}>
              {title}
            </div>
            <div style={{ display: 'flex', marginTop: 22, fontSize: 54, fontWeight: 700, color: CORAL }}>{price}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {place && <div style={{ display: 'flex', fontSize: 32, color: '#484848' }}>{place}</div>}
            {specs.length > 0 && (
              <div style={{ display: 'flex', marginTop: 16, gap: 16 }}>
                {specs.map((spec) => (
                  <div
                    key={spec.key}
                    style={{
                      display: 'flex',
                      padding: '10px 22px',
                      borderRadius: 999,
                      background: '#FFFFFF',
                      border: '2px solid #DDDDDD',
                      fontSize: 28,
                      color: '#222222',
                    }}
                  >
                    {spec.value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse só aceita <img>
          <img src={photo} alt="" width={460} height={630} style={{ objectFit: 'cover', width: 460, height: 630 }} />
        )}
      </div>
    ),
    size,
  )
}
