import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PricingClient from './PricingClient'
import { AuthModalProvider } from '@/components/auth/AuthModalProvider'

export const metadata = {
  title: 'Pricing — ShopFlow',
  description: 'Simple pricing for stores of every size. Start free, upgrade when you outgrow it.',
}

export default function PricingPage() {
  return (
    <AuthModalProvider>
      <div className="min-h-screen bg-white font-sans selection:bg-violet-200 selection:text-violet-900">
        <Header />
        <main className="pt-24 pb-24">
          <PricingClient />
        </main>
        <Footer />
      </div>
    </AuthModalProvider>
  )
}
