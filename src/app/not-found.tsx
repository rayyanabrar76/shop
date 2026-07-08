import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 p-6">
      <div className="text-center max-w-md">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">404</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 transition"
        >
          <Home className="w-4 h-4" /> Back to home
        </Link>
      </div>
    </div>
  )
}
