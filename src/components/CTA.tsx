import { SignedOut, SignInButton } from '@clerk/nextjs';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-32 bg-[#fdfdfc]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-[#212121] rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
          
          {/* Subtle Stone Grain / Pattern Overlay (Optional Vibe) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-semibold text-[#fdfdfc] mb-6 tracking-tight">
              Ready to build <br />
              <span className="text-[#a1a1a1]">your infrastructure?</span>
            </h2>
            
            <p className="text-[15px] md:text-[17px] text-[#a1a1a1] mb-12 max-w-xl mx-auto font-medium leading-relaxed">
              Join the next generation of commerce. Start building with our minimalist API and global edge network today.
            </p>
            
            <div className="flex flex-col md:flex-row justify-center gap-3 max-w-lg mx-auto bg-[#2a2a2a] p-2 rounded-full border border-white/5 shadow-inner">
              <input 
                type="email" 
                placeholder="Work email address" 
                className="px-6 py-3.5 rounded-full w-full bg-transparent text-[#fdfdfc] placeholder-[#6b6b6b] text-[14px] focus:outline-none"
              />
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-[#fdfdfc] text-[#212121] px-8 py-3.5 rounded-full font-bold text-[13px] hover:bg-white transition-all whitespace-nowrap flex items-center justify-center gap-2 group">
                    Get Started 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </SignInButton>
              </SignedOut>
            </div>

            <p className="mt-8 text-[11px] font-bold text-[#6b6b6b] uppercase tracking-[0.2em]">
              No credit card required • 14-day free trial
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}