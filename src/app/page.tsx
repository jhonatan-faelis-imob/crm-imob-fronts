import { redirect } from 'next/navigation'
import { PwaRedirect } from '@/components/PwaRedirect'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>
}) {
  const { source } = await searchParams

  if (source === 'pwa') {
    return <PwaRedirect />
  }

  redirect('/dashboard')
}
