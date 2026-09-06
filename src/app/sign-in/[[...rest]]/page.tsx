import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; redirect_url?: string }>
}) {
  const { mode, redirect_url } = await searchParams
  const initialMode = mode === 'sign-up' ? 'sign-up' : 'sign-in'
  // Only allow same-app relative paths as post-auth redirect targets.
  // Reject protocol-relative "//evil.com", which also starts with "/".
  const safeRedirect =
    redirect_url?.startsWith('/') && !redirect_url.startsWith('//') ? redirect_url : null
  const redirectUrl = safeRedirect ?? '/dashboard'

  // Someone already signed in has no business on the sign-in form.
  const { userId } = await auth()
  if (userId) redirect(redirectUrl)
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#fdfdfc] p-4">
      {/* Subtle grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-100 rounded-[26px] border border-[#e8e8e3] bg-[#fdfdfc] p-7 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.18)]">
        <Suspense fallback={null}>
          <AuthForm initialMode={initialMode} redirectUrl={redirectUrl} />
        </Suspense>
        <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-[#b5b5ad]">
          Secured by Clerk
        </p>
      </div>

      <Link
        href="/"
        className="absolute left-6 top-6 z-10 text-[13px] font-semibold text-[#8a8a82] transition-colors hover:text-[#212121]"
      >
        ← Back home
      </Link>
    </div>
  )
}
