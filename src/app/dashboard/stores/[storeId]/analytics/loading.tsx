import { Sk } from '@/components/ui/Skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="px-6 pt-8 pb-10 max-w-7xl mx-auto">
      <div className="space-y-2 mb-8">
        <Sk className="h-7 w-32" />
        <Sk className="h-4 w-64" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-5 space-y-3">
            <Sk className="h-3 w-24" />
            <Sk className="h-8 w-20" />
            <Sk className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-6 mb-6">
        <Sk className="h-5 w-36 mb-6" />
        <Sk className="h-52 w-full rounded-xl" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-6 space-y-4">
            <Sk className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <Sk className="h-4 w-36" />
                <Sk className="h-4 w-16" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
