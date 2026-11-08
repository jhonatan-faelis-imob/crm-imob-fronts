import { PwaRedirect } from '@/components/PwaRedirect'
import { About } from '@/components/landing/about'
import { Ai } from '@/components/landing/ai'
import { Audience } from '@/components/landing/audience'
import { Faq } from '@/components/landing/faq'
import { Features } from '@/components/landing/features'
import { FinalCta } from '@/components/landing/final-cta'
import { FollowUp } from '@/components/landing/follow-up'
import { Footer } from '@/components/landing/footer'
import { Goals } from '@/components/landing/goals'
import { Hero } from '@/components/landing/hero'
import { Nav } from '@/components/landing/nav'
import { Pricing } from '@/components/landing/pricing'
import { Stats } from '@/components/landing/stats'
import { faqJsonLd } from '@/lib/landing/faq'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ source?: string | string[] }>
}) {
  const { source } = await searchParams

  // Fluxo do app instalado (start_url = /?source=pwa): mantém o redirecionamento de sempre
  if (source === 'pwa') {
    return <PwaRedirect />
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()).replace(/</g, '\\u003c') }}
      />
      <Nav />
      <main>
        <Hero />
        <About />
        <Ai />
        <FollowUp />
        <Goals />
        <Features />
        <Stats />
        <Audience />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
