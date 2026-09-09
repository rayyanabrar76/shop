import { Sk } from '@/components/ui/Skeleton'

/**
 * The shape of the settings page before it has data.
 *
 * Drawn to the real layout rather than to a generic stack of cards: the page
 * opens on one section beside a list of the others, and a skeleton showing
 * three full-width cards means everything jumps sideways the moment the page
 * arrives. On a phone the list is a row of tabs, so the skeleton is too.
 */
export default function SettingsLoading() {
  return (
    <div className="max-w-5xl">
      <div className="px-4 md:px-6 pt-5 md:pt-6 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sk className="h-5 w-5 rounded-md" />
          <Sk className="h-4 w-20" />
        </div>
        <Sk className="h-8 w-24 rounded-lg" />
      </div>

      <div className="px-3.5 md:px-6 pb-10 flex flex-col md:flex-row gap-3 md:gap-8">
        <div className="flex md:flex-col gap-1 md:w-48 md:shrink-0 overflow-hidden">
          {['w-[68px]', 'w-[84px]', 'w-[62px]', 'w-[70px]', 'w-[60px]'].map((w, i) => (
            <Sk key={i} className={`h-8 shrink-0 rounded-lg ${w} md:w-full`} />
          ))}
        </div>

        <div className="flex-1 min-w-0 rounded-xl md:rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
          <div className="px-3.5 md:px-6 py-3 md:py-4 border-b border-(--admin-edge) space-y-1.5">
            <Sk className="h-3.5 w-32" />
            <Sk className="h-2.5 w-52 max-w-full" />
          </div>
          <div className="px-3.5 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="space-y-1.5">
                <Sk className="h-2.5 w-24" />
                <Sk className="h-10 w-full rounded-xl" />
              </div>
            ))}
            <Sk className="h-10 w-full md:w-36 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
