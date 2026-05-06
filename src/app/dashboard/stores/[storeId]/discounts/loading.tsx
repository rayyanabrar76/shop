import { Sk } from '@/components/ui/Skeleton'

export default function DiscountsLoading() {
  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="space-y-2 mb-8">
        <Sk className="h-7 w-40" />
        <Sk className="h-4 w-60" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Discount codes */}
        <div className="space-y-4">
          <Sk className="h-5 w-36" />
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-3">
            <Sk className="h-9 w-full" />
            <div className="flex gap-2">
              <Sk className="h-9 flex-1" />
              <Sk className="h-9 w-24" />
            </div>
            <Sk className="h-9 w-full" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-100 dark:border-zinc-800 px-4 py-3">
              <div className="space-y-1">
                <Sk className="h-4 w-24" />
                <Sk className="h-3 w-16" />
              </div>
              <Sk className="h-7 w-16 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Shipping rates */}
        <div className="space-y-4">
          <Sk className="h-5 w-32" />
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-3">
            <Sk className="h-9 w-full" />
            <div className="flex gap-2">
              <Sk className="h-9 flex-1" />
              <Sk className="h-9 flex-1" />
            </div>
            <Sk className="h-9 w-full" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-100 dark:border-zinc-800 px-4 py-3">
              <div className="space-y-1">
                <Sk className="h-4 w-28" />
                <Sk className="h-3 w-20" />
              </div>
              <Sk className="h-7 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
