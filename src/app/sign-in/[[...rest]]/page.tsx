import { Suspense } from 'react'
import Link from 'next/link'
import AuthForm from '@/components/auth/AuthForm'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const initialMode = mode === 'sign-up' ? 'sign-up' : 'sign-in'
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

      <div className="relative z-10 w-full max-w-[400px] rounded-[26px] border border-[#e8e8e3] bg-[#fdfdfc] p-7 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.18)]">
        <Suspense fallback={null}>
          <AuthForm initialMode={initialMode} redirectUrl="/dashboard" />
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
