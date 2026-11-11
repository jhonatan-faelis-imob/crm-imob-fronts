import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { InstallPWA } from '@/components/InstallPWA'
import { PaymentRequiredDialog } from '@/features/assinatura/payment-required-dialog'
import { SubscriptionBanner } from '@/features/assinatura/subscription-banner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Fixa: fica fora da área que rola */}
        <SubscriptionBanner />
        <main className="flex-1 overflow-y-auto bg-page p-6 pb-24 lg:pb-6">{children}</main>
        <BottomNav />
      </div>
      <InstallPWA />
      <PaymentRequiredDialog />
    </div>
  )
}
