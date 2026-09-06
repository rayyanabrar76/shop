'use client'

import { useEffect, useState } from 'react'
import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs'
import { ArrowRight, Eye, EyeOff, Loader2, Mail, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { FaLinkedinIn } from 'react-icons/fa'

type Mode = 'sign-in' | 'sign-up'
type Step = 'credentials' | 'verify-email' | 'reset-request' | 'reset-code'

type OAuthStrategy = 'oauth_google' | 'oauth_linkedin_oidc' | 'oauth_microsoft'

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className} aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}

/** Clerk rejects a sign-in attempt when a session is already active. */
function isAlreadySignedIn(err: unknown): boolean {
  const e = err as { errors?: { code?: string }[] }
  return e?.errors?.some(x => x.code === 'session_exists') ?? false
}

function clerkError(err: unknown): string {
  const e = err as { errors?: { longMessage?: string; message?: string }[] }
  return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? 'Something went wrong. Please try again.'
}

export default function AuthForm({
  initialMode = 'sign-in',
  redirectUrl = '/dashboard',
  onClose,
}: {
  initialMode?: Mode
  redirectUrl?: string
  onClose?: () => void
}) {
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn()
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp()

  const [mode, setMode] = useState<Mode>(initialMode)
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<OAuthStrategy | null>(null)
  const [error, setError] = useState('')

  const ready = signInLoaded && signUpLoaded

  // The page is server-rendered, so a session established in another tab (or
  // just after this HTML was produced) leaves the form on screen even though
  // Clerk already has one. Submitting then fails with "You're already signed
  // in", so send them on instead.
  useEffect(() => {
    if (authLoaded && isSignedIn) window.location.assign(redirectUrl)
  }, [authLoaded, isSignedIn, redirectUrl])

  /**
   * setActive is what writes the session cookie, and it is async. Navigating
   * without awaiting it raced the middleware: the request for the destination
   * went out before the cookie existed, so the middleware saw a signed-out user
   * and bounced straight back to /sign-in.
   *
   * The navigation is a full page load rather than router.push so the server
   * definitely renders with the new cookie — it happens once, right after
   * sign-in, where a reload costs nothing.
   */
  async function finish(session: string | null) {
    try {
      if (mode === 'sign-up') await setActiveSignUp?.({ session })
      else await setActiveSignIn?.({ session })
    } catch (err) {
      setError(clerkError(err))
      return
    }
    onClose?.()
    window.location.assign(redirectUrl)
  }

  async function handleOAuth(strategy: OAuthStrategy) {
    if (!signIn) return
    setError('')
    setOauthLoading(strategy)
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: redirectUrl,
      })
    } catch (err) {
      setError(clerkError(err))
      setOauthLoading(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ready) return
    setError('')
    setLoading(true)
    try {
      // ── Sign in ──────────────────────────────────────────────
      if (mode === 'sign-in' && step === 'credentials') {
        const res = await signIn!.create({ identifier: email, password })
        if (res.status === 'complete') return await finish(res.createdSessionId)
        else setError('Additional verification is required to sign in.')
      }

      // ── Sign up: create + send email code ────────────────────
      else if (mode === 'sign-up' && step === 'credentials') {
        await signUp!.create({ emailAddress: email, password })
        await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' })
        setStep('verify-email')
      }

      // ── Sign up: verify email code ───────────────────────────
      else if (mode === 'sign-up' && step === 'verify-email') {
        const res = await signUp!.attemptEmailAddressVerification({ code })
        if (res.status === 'complete') return await finish(res.createdSessionId)
        else setError('That code was not correct. Please try again.')
      }

      // ── Forgot password: send reset code ─────────────────────
      else if (step === 'reset-request') {
        await signIn!.create({ strategy: 'reset_password_email_code', identifier: email })
        setStep('reset-code')
      }

      // ── Forgot password: verify code + set new password ──────
      else if (step === 'reset-code') {
        const res = await signIn!.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code,
          password,
        })
        if (res.status === 'complete') return await finish(res.createdSessionId)
        else setError('That code was not correct. Please try again.')
      }
    } catch (err) {
      if (isAlreadySignedIn(err)) {
        window.location.assign(redirectUrl)
        return
      }
      setError(clerkError(err))
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-[#e8e8e3] bg-white px-4 py-3 text-[14px] text-[#212121] outline-none transition-all placeholder:text-[#b5b5ad] focus:border-[#212121] focus:ring-2 focus:ring-black/5'
  const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-[#8a8a82] mb-1.5'

  const isReset = step === 'reset-request' || step === 'reset-code'
  const isCredentials = step === 'credentials'

  const heading = isReset
    ? 'Reset your password'
    : step === 'verify-email'
    ? 'Check your email'
    : mode === 'sign-in'
    ? 'Sign in to Shopflow'
    : 'Create your Shopflow account'

  const subheading = isReset
    ? step === 'reset-request'
      ? "Enter your email and we'll send a reset code."
      : `Enter the code sent to ${email} and choose a new password.`
    : step === 'verify-email'
    ? `We sent a 6-digit code to ${email}.`
    : mode === 'sign-in'
    ? 'Welcome back! Please sign in to continue.'
    : 'Start building your store in minutes.'

  // Clerk resolves the session on the client, a beat after this HTML arrives.
  // Rendering the form in that window meant a signed-in owner saw a sign-in
  // page flash before being redirected. Hold a quiet placeholder until we know
  // which it is — and keep holding it while the redirect runs.
  if (!authLoaded || isSignedIn) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <span className="text-2xl font-black tracking-tighter text-[#212121]">
          Shopflow<span className="text-[#b5b5ad]">.</span>
        </span>
        <Loader2 className="h-5 w-5 animate-spin text-[#8a8a82]" />
        <p className="text-[13px] text-[#8a8a82]">
          {isSignedIn ? 'Taking you there…' : 'Just a moment…'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <span className="text-2xl font-black tracking-tighter text-[#212121]">
            Shopflow<span className="text-[#b5b5ad]">.</span>
          </span>
        </div>
        <h2 className="text-[19px] font-bold tracking-tight text-[#212121]">{heading}</h2>
        <p className="mt-1 text-[13px] text-[#8a8a82]">{subheading}</p>
      </div>

      {/* OAuth + email form only on the first credentials step */}
      {isCredentials && (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            {([
              { s: 'oauth_google' as const, icon: <FcGoogle className="h-5 w-5" /> },
              { s: 'oauth_linkedin_oidc' as const, icon: <FaLinkedinIn className="h-4 w-4 text-[#0a66c2]" /> },
              { s: 'oauth_microsoft' as const, icon: <MicrosoftIcon className="h-4 w-4" /> },
            ]).map(({ s, icon }) => (
              <button
                key={s}
                type="button"
                disabled={!!oauthLoading || loading}
                onClick={() => handleOAuth(s)}
                className="flex items-center justify-center rounded-xl border border-[#e8e8e3] bg-white py-3 transition-all hover:border-[#d4d4cc] hover:bg-[#fafaf8] active:scale-95 disabled:opacity-50"
              >
                {oauthLoading === s ? <Loader2 className="h-4 w-4 animate-spin text-[#8a8a82]" /> : icon}
              </button>
            ))}
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e8e8e3]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#b5b5ad]">or</span>
            <div className="h-px flex-1 bg-[#e8e8e3]" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email — shown on credentials & reset-request */}
        {(isCredentials || step === 'reset-request') && (
          <div>
            <label className={labelCls}>Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b5b5ad]" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
        )}

        {/* Verification code — verify-email & reset-code */}
        {(step === 'verify-email' || step === 'reset-code') && (
          <div>
            <label className={labelCls}>Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className={`${inputCls} text-center text-lg tracking-[0.4em]`}
            />
          </div>
        )}

        {/* Password — credentials & reset-code (new password) */}
        {(isCredentials || step === 'reset-code') && (
          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>{step === 'reset-code' ? 'New password' : 'Password'}</label>
              {mode === 'sign-in' && isCredentials && (
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setStep('reset-request')
                  }}
                  className="mb-1.5 text-[11px] font-semibold text-[#8a8a82] hover:text-[#212121]"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'sign-up' || step === 'reset-code' ? 'Min. 8 characters' : '••••••••'}
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b5b5ad] hover:text-[#8a8a82]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-red-600">{error}</p>
        )}

        {/* Clerk CAPTCHA mount point (required for sign-up bot protection) */}
        {mode === 'sign-up' && isCredentials && <div id="clerk-captcha" />}

        <button
          type="submit"
          disabled={loading || !ready}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#212121] py-3.5 text-[13px] font-bold text-white transition-all hover:bg-black active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {isReset
                ? step === 'reset-request'
                  ? 'Send reset code'
                  : 'Reset password'
                : step === 'verify-email'
                ? 'Verify email'
                : mode === 'sign-in'
                ? 'Continue'
                : 'Create account'}
              {step === 'verify-email' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </>
          )}
        </button>
      </form>

      {/* Footer nav */}
      <div className="mt-5 text-center text-[13px]">
        {isReset || step === 'verify-email' ? (
          <button
            onClick={() => {
              setError('')
              setCode('')
              setStep('credentials')
              if (isReset) setMode('sign-in')
            }}
            className="inline-flex items-center gap-1 font-semibold text-[#8a8a82] hover:text-[#212121]"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to sign in
          </button>
        ) : mode === 'sign-in' ? (
          <span className="text-[#8a8a82]">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => {
                setError('')
                setMode('sign-up')
              }}
              className="font-bold text-[#212121] hover:underline"
            >
              Sign up
            </button>
          </span>
        ) : (
          <span className="text-[#8a8a82]">
            Already have an account?{' '}
            <button
              onClick={() => {
                setError('')
                setMode('sign-in')
              }}
              className="font-bold text-[#212121] hover:underline"
            >
              Sign in
            </button>
          </span>
        )}
      </div>
    </div>
  )
}
