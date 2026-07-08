import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <main className="pt-24 pb-24 px-6 md:px-12">
        <article className="prose prose-zinc max-w-3xl mx-auto">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  )
}
