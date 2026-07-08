'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fdfdfc]">
      <span className="text-2xl font-black tracking-tighter text-[#212121]">
        Shopflow<span className="text-[#b5b5ad]">.</span>
      </span>
      <Loader2 className="h-5 w-5 animate-spin text-[#8a8a82]" />
      <p className="text-[13px] text-[#8a8a82]">Signing you in…</p>
      {/* Completes the OAuth handshake and redirects to redirectUrlComplete */}
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
