'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Theme {
  primaryColor: string
  borderRadius: string
  headingFont: string
}

export default function ForgotPasswordForm({
  subdomain,
  theme,
  resetToken,
}: {
  subdomain: string
  theme: Theme
  resetToken?: string
}) {
  const router = useRouter()
  const { primaryColor, borderRadius, headingFont } = theme
  const fontFamily = headingFont === 'serif' ? 'serif' : 'inherit'

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputCls = 'w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400 transition-colors bg-white'

  // ── Reset password form (token present) ──────────────────────────────────
  if (resetToken) {
    const handleReset = async (e: React.FormEvent) => {
      e.preventDefault()
      if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
      if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/storefront/${subdomain}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password: newPassword }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Reset failed'); return }
        router.push(`/store/${subdomain}/login`)
      } catch {
        setError('Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-black tracking-tight mb-2" style={{ fontFamily }}>
          Set New Password
        </h1>
        <p className="text-sm opacity-60 mb-8">Enter your new password below.</p>
        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-1.5">New Password</label>
            <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-1.5">Confirm Password</label>
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: primaryColor, borderRadius }}>
            {loading ? 'Saving…' : 'Set New Password'}
          </button>
        </form>
      </div>
    )
  }

  // ── Forgot password form ─────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/storefront/${subdomain}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setSent(true)
      else setError('Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2" style={{ fontFamily }}>Check your email</h1>
        <p className="text-sm opacity-60 mb-6">
          If an account with that email exists, we&apos;ve sent a reset link.
        </p>
        <Link href={`/store/${subdomain}/login`} className="text-sm font-bold hover:underline" style={{ color: primaryColor }}>
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-3xl font-black tracking-tight mb-2" style={{ fontFamily }}>
        Forgot Password
      </h1>
      <p className="text-sm opacity-60 mb-8">Enter your email and we&apos;ll send a reset link.</p>
      {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleForgot} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-1.5">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: primaryColor, borderRadius }}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm opacity-60">
        <Link href={`/store/${subdomain}/login`} className="font-bold opacity-100 hover:underline" style={{ color: primaryColor }}>
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
