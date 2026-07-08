'use client'

import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import AuthForm from './AuthForm'

type Mode = 'sign-in' | 'sign-up'

interface AuthModalContextValue {
  openAuth: (mode?: Mode, redirectUrl?: string) => void
  closeAuth: () => void
}

// Default falls back to the full-page /sign-in route when no provider is
// mounted (e.g. the Header on legal/pricing pages), so consumers never crash.
const AuthModalContext = createContext<AuthModalContextValue>({
  openAuth: (mode?: Mode, redirectUrl?: string) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams()
      if (mode === 'sign-up') params.set('mode', 'sign-up')
      if (redirectUrl) params.set('redirect_url', redirectUrl)
      const qs = params.toString()
      window.location.href = qs ? `/sign-in?${qs}` : '/sign-in'
    }
  },
  closeAuth: () => {},
})

export function useAuthModal() {
  return useContext(AuthModalContext)
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('sign-in')
  const [redirectUrl, setRedirectUrl] = useState('/dashboard')

  const openAuth = useCallback((m: Mode = 'sign-in', r = '/dashboard') => {
    setMode(m)
    setRedirectUrl(r)
    setOpen(true)
  }, [])

  const closeAuth = useCallback(() => setOpen(false), [])

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <AuthModalContext.Provider value={{ openAuth, closeAuth }}>
      {children}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
              onClick={closeAuth}
              aria-hidden
            />

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-[400px] rounded-[26px] border border-[#e8e8e3] bg-[#fdfdfc] p-7 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.35)]"
              role="dialog"
              aria-modal="true"
            >
              <button
                onClick={closeAuth}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#a1a19a] transition-colors hover:bg-[#f0f0eb] hover:text-[#212121]"
              >
                <X className="h-4 w-4" />
              </button>

              <AuthForm initialMode={mode} redirectUrl={redirectUrl} onClose={closeAuth} />

              <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-[#b5b5ad]">
                Secured by Clerk
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthModalContext.Provider>
  )
}
