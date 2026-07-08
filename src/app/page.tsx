import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';

export default function HomePage() {
  return (
    <AuthModalProvider>
      <div className="min-h-screen bg-white font-sans selection:bg-violet-200 selection:text-violet-900">
        <Header />

        <main>
          <Hero />
          <Features />
          <CTA />
        </main>

        <Footer />
      </div>
    </AuthModalProvider>
  );
}