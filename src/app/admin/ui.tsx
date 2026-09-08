import Link from 'next/link'

/**
 * The few shapes every page in the platform admin is built from, at the same
 * sizes the merchant dashboard uses so the two read as one product.
 */

export function PageTitle({ title, meta, action }: { title: string; meta?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h1 className="text-[19px] md:text-[22px] font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 truncate">
          {title}
        </h1>
        {meta && <p className="text-[11.5px] text-zinc-500 mt-0.5 truncate">{meta}</p>}
      </div>
      {action}
    </div>
  )
}

/** A figure. Same tile the dashboard home uses, swipeable in a Figures row. */
export function Figure({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="bg-(--admin-card) rounded-xl sm:rounded-2xl border border-(--admin-border) px-2.5 py-2 sm:px-3 sm:py-2">
      <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{label}</p>
      <p className="mt-0.5 text-[14px] sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">{value}</p>
      {note && <p className="text-[10px] text-zinc-500 truncate">{note}</p>}
    </div>
  )
}

export function Figures({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-0.5 mb-2.5 *:snap-start *:shrink-0 *:w-[44%] sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 sm:mb-3 sm:overflow-visible sm:*:w-auto">
      {children}
    </div>
  )
}

export function Panel({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-3.5 py-2 border-b border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
        {meta && <span className="text-[10.5px] text-zinc-500 tabular-nums shrink-0">{meta}</span>}
      </div>
      {children}
    </section>
  )
}

export function Empty({ title, note }: { title: string; note?: string }) {
  return (
    <div className="px-5 py-7 text-center">
      <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">{title}</p>
      {note && <p className="mt-0.5 text-[11px] text-zinc-500">{note}</p>}
    </div>
  )
}

/** A person or a shop, as a small round mark. */
export function Avatar({ src, name, size = 28 }: { src?: string | null; name: string; size?: number }) {
  const initials = name.trim().slice(0, 2).toUpperCase() || '?'
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/15"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-(--admin-bg-muted) text-[10px] font-bold text-zinc-600 dark:text-zinc-300"
    >
      {initials}
    </span>
  )
}

export function Pill({ children, tone = 'zinc' }: { children: React.ReactNode; tone?: 'zinc' | 'green' | 'amber' | 'violet' }) {
  const map = {
    zinc: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
    green: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    violet: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400',
  }
  return (
    <span className={`inline-flex shrink-0 items-center h-4.5 px-1.5 rounded-full text-[10px] font-semibold ${map[tone]}`}>
      {children}
    </span>
  )
}

/** A row in one of the lists. The whole row is the link. */
export function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2.5 px-3 sm:px-3.5 py-2 hover:bg-(--admin-bg-muted) transition-colors"
      >
        {children}
      </Link>
    </li>
  )
}

/** Dates read at a glance: "3 days ago" beats a formatted timestamp in a list. */
export function ago(d: Date): string {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
