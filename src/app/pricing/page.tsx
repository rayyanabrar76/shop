import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PricingClient from './PricingClient'

export const metadata = {
  title: 'Pricing — ShopFlow',
  description: 'Simple pricing for stores of every size. Start free, upgrade when you outgrow it.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-violet-200 selection:text-violet-900">
      <Header />
      <main className="pt-24 pb-24">
        <PricingClient />
      </main>
      <Footer />
    </div>
  )
}
