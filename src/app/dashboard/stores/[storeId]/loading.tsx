import { Sk } from '@/components/ui/Skeleton'

export default function StoreLoading() {
  return (
    <div className="p-5 pt-16 md:p-10 md:pt-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Sk className="h-8 w-48" />
          <Sk className="h-4 w-72" />
        </div>
        <Sk className="h-10 w-36" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Sk className="h-4 w-28" />
              <Sk className="h-8 w-8 rounded-lg" />
            </div>
            <Sk className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-3">
            <Sk className="h-10 w-10 rounded-xl" />
            <Sk className="h-5 w-24" />
            <Sk className="h-3 w-36" />
          </div>
        ))}
      </div>
    </div>
  )
}
