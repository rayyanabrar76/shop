'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../auth-context'

interface Theme {
  primaryColor: string
  borderRadius: string
  buttonStyle: string
  headingFont: string
}

export default function SignupForm({
  subdomain,
  theme,
}: {
  subdomain: string
  theme: Theme
}) {
  const router = useRouter()
  const { setCustomer } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { primaryColor, borderRadius } = theme

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/storefront/${subdomain}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Signup failed'); return }
      setCustomer({ customerId: data.customer.id, email: data.customer.email, name: data.customer.name })
      router.push(`/store/${subdomain}/account`)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400 transition-colors bg-white'

  return (
    <div className="w-full max-w-sm">
      <h1
        className="text-3xl font-black tracking-tight mb-2"
        style={{ fontFamily: theme.headingFont === 'serif' ? 'serif' : 'inherit' }}
      >
        Create Account
      </h1>
      <p className="text-sm opacity-60 mb-8">Join the store to track your orders.</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputCls}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputCls}
            placeholder="Min. 8 characters"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-1.5">Confirm Password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: primaryColor, borderRadius }}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 border-t border-zinc-200" />
        <span className="text-xs text-zinc-400 uppercase tracking-widest">or</span>
        <div className="flex-1 border-t border-zinc-200" />
      </div>

      <a
        href={`/api/storefront/${subdomain}/auth/google`}
        className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </a>

      <p className="mt-6 text-center text-sm opacity-60">
        Already have an account?{' '}
        <Link href={`/store/${subdomain}/login`} className="font-bold opacity-100 hover:underline" style={{ color: primaryColor }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
