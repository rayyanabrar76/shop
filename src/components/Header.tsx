"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser, useClerk } from '@clerk/nextjs';
import { ArrowRight, LogOut, LayoutGrid, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full h-18"
      style={{
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      <div className="max-w-7xl mx-auto h-full px-6 md:px-12 lg:px-16 flex justify-between items-center">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter text-[#212121]">
            Shopflow<span className="text-[#6b6b6b]">.</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          <Link href="/pricing" className="text-[13px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
            Pricing
          </Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-[13px] text-white transition-all active:scale-95 hover:opacity-90"
              style={{
                background: "#000",
                boxShadow: "0 4px 14px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>

              {/* Trigger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-2xl transition-all active:scale-95"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: isOpen
                    ? "0 0 0 2px rgba(0,0,0,0.08)"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <img
                  src={user?.imageUrl}
                  alt="User"
                  className="w-7 h-7 rounded-xl object-cover"
                  style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                />
                <span className="text-[13px] font-semibold" style={{ color: "#111" }}>
                  Account
                </span>
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{
                    color: "#aaa",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2.5 w-56 z-50"
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "20px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.1)",
                      padding: "6px",
                    }}
                  >
                    {/* User info */}
                    <div
                      className="px-3.5 py-3 mb-1"
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#bbb" }}>
                        Signed in as
                      </p>
                      <p className="text-[13px] font-semibold truncate" style={{ color: "#000" }}>
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>

                    {/* Dashboard link */}
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                      style={{ color: "#444" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "#f0f0f0" }}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" style={{ color: "#333" }} />
                      </div>
                      Go to Dashboard
                    </Link>

                    {/* Sign out */}
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                      style={{ color: "#e53e3e" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "#fff0f0" }}
                      >
                        <LogOut className="w-3.5 h-3.5" style={{ color: "#e53e3e" }} />
                      </div>
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}