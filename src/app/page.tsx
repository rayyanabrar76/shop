import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-violet-200 selection:text-violet-900">
      <Header />
      
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}