import Link from 'next/link'

export const metadata = { title: 'Offline · ShopFlow' }

/**
 * What the installed app shows when the phone has no connection.
 *
 * Deliberately plain and deliberately honest: this app is a live view of a
 * shop, so there is nothing to show without a network, and pretending
 * otherwise with a cached dashboard would be worse than saying so.
 */
export default function Offline() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#0a0a0a] px-8 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={64} height={64} className="rounded-2xl" />
      <h1 className="text-lg font-bold tracking-tight">No connection</h1>
      <p className="max-w-xs text-[13px] leading-relaxed text-white/60">
        ShopFlow shows your shop as it is right now, so it needs a connection to
        tell you anything true. This page will work again the moment you are back.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-bold text-[#0a0a0a] transition-opacity hover:opacity-90"
      >
        Try again
      </Link>
    </div>
  )
}
