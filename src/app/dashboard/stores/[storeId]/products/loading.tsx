import { Sk } from '@/components/ui/Skeleton'

export default function ProductsLoading() {
  return (
    <div className="p-5 pt-16 md:p-10 md:pt-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Sk className="h-7 w-32" />
          <Sk className="h-4 w-56" />
        </div>
        <Sk className="h-9 w-36" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Sk className="h-9 w-64" />
        <Sk className="h-9 w-32" />
        <Sk className="h-9 w-28" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="border-b border-zinc-100 dark:border-zinc-800 px-5 py-3 flex gap-6">
          {['w-48', 'w-20', 'w-24', 'w-20', 'w-16'].map((w, i) => (
            <Sk key={i} className={`h-3.5 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
            <Sk className="h-12 w-12 rounded-xl shrink-0" />
            <Sk className="h-4 w-40" />
            <Sk className="h-4 w-16" />
            <Sk className="h-4 w-20" />
            <Sk className="h-5 w-14 rounded-full" />
            <Sk className="h-7 w-16 rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
