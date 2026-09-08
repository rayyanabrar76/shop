"use client";

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { SignedOut, SignedIn } from "@clerk/nextjs";
import { ArrowRight, Play, CreditCard, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import Mockup from "./Mockup";
import { useAuthModal } from "./auth/AuthModalProvider";

const SLIDES = [
  { word: "gear.", font: "font-sans tracking-tighter" },
  { word: "art.", font: "font-serif italic tracking-normal" },
  { word: "vision.", font: "font-mono tracking-tighter uppercase font-light" },
  { word: "brand.", font: "font-sans font-black tracking-tight" },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { openAuth } = useAuthModal();

  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % SLIDES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const bgGradient = useTransform(
    [smoothX, smoothY],
    ([x, y]: number[]) =>
      `radial-gradient(700px circle at ${x}px ${y}px, rgba(0,0,0,0.03), transparent 70%)`
  );

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen pt-32 pb-20 flex flex-col lg:flex-row items-center justify-center overflow-hidden px-6 lg:px-24"
      style={{ background: "#ffffff" }}
    >
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Mouse spotlight */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: bgGradient }} />

      {/* Soft top-right shadow orb */}
      <div
        className="pointer-events-none absolute -top-20 -right-15 w-120 h-120 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(0,0,0,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* LEFT */}
      <div className="flex-1 z-10 max-w-3xl text-center lg:text-left">

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest"
          style={{
            background: "#f5f5f5",
            border: "1px solid rgba(0,0,0,0.08)",
            color: "#888",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#000", boxShadow: "0 0 5px rgba(0,0,0,0.3)" }}
          />
          Now in early access
        </motion.div>

        {/* Headline */}
        <div className="min-h-40 md:min-h-52 flex flex-col justify-end mb-6">
          <h1
            className="font-semibold text-black leading-[0.9] tracking-tight"
            style={{ fontSize: "clamp(56px, 9vw, 108px)" }}
          >
            Sell your <br />
            <div className="relative inline-block overflow-hidden py-3">
              <AnimatePresence mode="wait">
                <motion.span
                  key={SLIDES[index].word}
                  initial={{ y: 90, opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -90, opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className={`block ${SLIDES[index].font}`}
                  style={{ color: "#888" }}
                >
                  {SLIDES[index].word}
                </motion.span>
              </AnimatePresence>
            </div>
          </h1>
        </div>

        {/* Body copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-[17px] leading-relaxed mb-12 max-w-sm lg:mx-0 mx-auto"
          style={{ color: "#666", fontWeight: 450 }}
        >
          High-end ecommerce simplified. No technical skills required.
          Just your products and a direct line to your customers.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-20"
        >
          <SignedOut>
            <button
              onClick={() => openAuth("sign-up")}
              className="group relative px-8 py-4 rounded-2xl font-semibold text-[14px] text-white flex items-center gap-2.5 transition-all active:scale-95 hover:bg-black"
              style={{
                background: "#000",
                boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 32px -8px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.12)",
              }}
            >
              Launch Store
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <button
                className="group relative px-8 py-4 rounded-2xl font-semibold text-[14px] text-white flex items-center gap-2.5 transition-all active:scale-95"
                style={{
                  background: "#000",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 32px -8px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.12)",
                }}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
          </SignedIn>

          {/* Ghost CTA */}
          <button
            className="group flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold text-[14px] transition-all active:scale-95 hover:bg-[#f5f5f5]"
            style={{
              background: "#fafafa",
              border: "1px solid rgba(0,0,0,0.08)",
              color: "#333",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
              style={{ background: "rgba(0,0,0,0.06)" }}
            >
              <Play className="w-3 h-3 fill-current ml-0.5" style={{ color: "#333" }} />
            </div>
            Watch Demo
          </button>
        </motion.div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center lg:justify-start items-center gap-8 pt-8"
          style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
        >
          {[
            { icon: CreditCard, label: "Stripe Ready" },
            { icon: ShieldCheck, label: "Encrypted" },
            { icon: Zap, label: "Instant Pay" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 cursor-pointer group transition-all"
              style={{ color: "#bbb" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:bg-[#f0f0f0]"
                style={{ background: "rgba(0,0,0,0.04)" }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] group-hover:text-[#333] transition-colors">
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* RIGHT, Mockup, no clipping wrapper so badges float freely */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 w-full flex justify-center lg:justify-end mt-24 lg:mt-0 lg:pl-16 z-10"
      >
        <Mockup />
      </motion.div>
    </section>
  );
}