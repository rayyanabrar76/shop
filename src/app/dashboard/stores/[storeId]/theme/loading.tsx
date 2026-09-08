import { Sk } from '@/components/ui/Skeleton'

/**
 * The shape the customisation page actually has: the preview with its frosted
 * bar, then the index of the storefront in two groups. Drawn in the same
 * proportions as the real thing so nothing jumps when it arrives.
 */
export default function ThemeLoading() {
  return (
    <div className="max-w-5xl px-4 md:px-6 pt-5 md:pt-6 pb-10">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Sk className="h-8 w-8 rounded-lg" />
          <Sk className="h-5 w-36" />
        </div>
        <Sk className="h-8 w-28 rounded-lg" />
      </div>

      <div className="space-y-6">
        {/* The preview: a picture with a frosted panel floating at the foot. */}
        <div className="relative rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
          <Sk className="aspect-4/3 md:aspect-16/10 w-full rounded-none" />
          <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-3 sm:bottom-3 flex items-center gap-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 px-3.5 py-2.5 ring-1 ring-black/5 dark:ring-white/10">
            <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Sk className="h-3 w-48" />
              <Sk className="hidden sm:block h-2.5 w-36" />
            </div>
            <Sk className="h-8 w-20 rounded-lg" />
            <Sk className="h-8 w-24 rounded-lg" />
          </div>
        </div>

        {/* The index */}
        <div className="rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
          {[6, 3].map((rows, g) => (
            <div key={g} className={g > 0 ? 'border-t border-(--admin-edge)' : ''}>
              <div className="flex items-baseline gap-2 px-5 pt-3.5 pb-1.5">
                <Sk className="h-2.5 w-10" />
                <Sk className="h-2.5 w-28" />
              </div>
              <ul className="pb-1.5">
                {Array.from({ length: rows }).map((_, i) => (
                  <li key={i} className="flex items-center gap-4 mx-1.5 px-3.5 h-13 sm:h-12">
                    <Sk className="h-8 w-8 rounded-lg shrink-0" />
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <Sk className="h-3 w-28" />
                      <Sk className="h-2.5 w-40" />
                    </div>
                    <Sk className="h-4 w-4 rounded" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
