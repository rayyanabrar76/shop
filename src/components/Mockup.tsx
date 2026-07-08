"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, ArrowUpRight, Sparkles } from "lucide-react";

const SLIDES = [
  {
    id: "hero",
    title: "Vapor Max Elite",
    subtitle: "High Performance",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    accent: "bg-[#f3f3ee]"
  },
  {
    id: "product",
    title: "Obsidian Series",
    subtitle: "Premium Craft",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
    accent: "bg-[#f9f9f7]"
  },
  {
    id: "success",
    title: "Order Paid",
    subtitle: "Stripe: Success",
    img: "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=600",
    accent: "bg-green-50"
  }
];

export default function Mockup() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4000); // 4 seconds per view
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-110 perspective-1000 group">
      {/* Glow Effect behind phone */}
      <div className="absolute -inset-10 bg-linear-to-tr from-[#212121]/5 to-transparent rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-100" />

      {/* Phone Shell */}
      <div className="relative bg-[#0a0a0a] p-3 rounded-[3.8rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-white/10">
        <div className="bg-white rounded-[3rem] overflow-hidden min-h-160 flex flex-col relative shadow-inner">
          
          {/* Status Bar Mockup */}
          <div className="px-10 pt-6 pb-4 flex justify-between items-center bg-white z-20">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-[#212121] uppercase tracking-widest">Store Live</span>
            </div>
            <ShoppingBag className="w-4 h-4 text-[#212121]" />
          </div>

          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 p-8 flex flex-col"
              >
                {/* Visual Area */}
                <div className={`relative aspect-4/5 rounded-[2.5rem] overflow-hidden mb-8 ${SLIDES[currentSlide].accent} shadow-sm border border-[#f5f5f2]`}>
                  <motion.img 
                    layoutId="product-img"
                    src={SLIDES[currentSlide].img} 
                    className="w-full h-full object-cover grayscale-[0.05]" 
                  />
                  
                  {SLIDES[currentSlide].id === "success" && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-md flex items-center justify-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-[#212121] rounded-full flex items-center justify-center shadow-2xl">
                        <Check className="w-10 h-10 text-white" />
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-bold text-[#a1a1a1] uppercase tracking-[0.25em]">
                    {SLIDES[currentSlide].subtitle}
                  </motion.p>
                  <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black text-[#212121] tracking-tighter">
                    {SLIDES[currentSlide].title}
                  </motion.h3>
                </div>

                {/* Footer Action */}
                <div className="mt-auto">
                  <div className={`w-full py-4.5 rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 border transition-all ${
                    SLIDES[currentSlide].id === "success" 
                    ? 'bg-green-600 border-transparent text-white' 
                    : 'bg-[#212121] text-white border-transparent'
                  }`}>
                    {SLIDES[currentSlide].id === "success" ? "Receipt Delivered" : "Instant Checkout"}
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Timeline */}
          <div className="px-10 pb-10 flex gap-2">
            {SLIDES.map((_, i) => (
              <div key={i} className="h-1 flex-1 bg-[#f3f3ee] rounded-full overflow-hidden">
                {i === currentSlide && (
                  <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 4, ease: "linear" }} className="h-full bg-[#212121]" />
                )}
                {i < currentSlide && <div className="h-full w-full bg-[#212121]" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Badges */}
      <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-10 -right-12 bg-white/90 backdrop-blur-xl p-5 rounded-4xl shadow-2xl border border-[#e8e8e3] hidden lg:flex items-center gap-4 z-30">
        <div className="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center text-green-600"><Sparkles className="w-5 h-5" /></div>
        <div>
          <p className="text-[10px] font-black text-[#a1a1a1] uppercase tracking-widest">Revenue Today</p>
          <p className="text-xl font-black text-[#212121]">$3,842.00</p>
        </div>
      </motion.div>
    </div>
  );
}