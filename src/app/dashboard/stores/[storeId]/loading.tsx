import { Sk } from '@/components/ui/Skeleton'

/**
 * The shape the home page actually has: the store's name and address, a row
 * of figures, then two columns — setup and orders on the left, what wants
 * doing on the right. It described three stat cards and a row of quick links,
 * which the page has not had for a while, so the layout jumped as soon as the
 * real thing arrived.
 */
export default function StoreLoading() {
  return (
    <div className="max-w-6xl px-4 md:px-6 pt-5 md:pt-7 pb-10">
      {/* Name and address */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="space-y-2">
          <Sk className="h-6 w-52" />
          <Sk className="h-3 w-64" />
        </div>
        <Sk className="h-9 w-36 rounded-lg" />
      </div>

      {/* The figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) px-3.5 py-3.5 sm:px-5 sm:py-4 space-y-2 ${
              i === 0 ? 'col-span-2 lg:col-span-1' : ''
            }`}
          >
            <Sk className="h-2.5 w-24" />
            <Sk className="h-6 w-20" />
            <Sk className="h-2.5 w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <div className="lg:col-span-2 space-y-4 lg:space-y-5">
          {/* Setup */}
          <div className="rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
            <div className="flex items-center gap-3 px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-3">
              <div className="flex-1 space-y-2">
                <Sk className="h-3.5 w-40" />
                <Sk className="h-2.5 w-20" />
              </div>
              <Sk className="h-9 w-9 rounded-full" />
            </div>
            <ul className="pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 mx-1.5 px-3 py-2.5">
                  <Sk className="h-7 w-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Sk className="h-3 w-44" />
                    <Sk className="h-2.5 w-32" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent orders */}
          <div className="rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
            <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 border-b border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
              <Sk className="h-3 w-28" />
              <Sk className="h-2.5 w-20" />
            </div>
            <ul className="divide-y divide-(--admin-edge)">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-3.5 sm:px-5 py-3">
                  <Sk className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Sk className="h-3 w-32" />
                    <Sk className="h-2.5 w-16" />
                  </div>
                  <Sk className="hidden sm:block h-5 w-14 rounded-full" />
                  <Sk className="h-3.5 w-16" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-5">
          {[3, 5].map((rows, g) => (
            <div key={g} className="rounded-xl sm:rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
              <div className="px-3.5 sm:px-5 py-3 flex items-center border-b border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
                <Sk className="h-3 w-32" />
              </div>
              <ul className="py-1.5">
                {Array.from({ length: rows }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 mx-1.5 px-3 py-2">
                    <Sk className="h-5 w-5 rounded-full shrink-0" />
                    <Sk className="h-2.5 flex-1 max-w-40" />
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
