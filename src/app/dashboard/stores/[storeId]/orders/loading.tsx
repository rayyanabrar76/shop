import { Sk } from '@/components/ui/Skeleton'

export default function OrdersLoading() {
  return (
    <div className="px-6 pt-8 pb-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Sk className="h-7 w-28" />
          <Sk className="h-4 w-52" />
        </div>
        <Sk className="h-9 w-32" />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-4 space-y-2">
            <Sk className="h-3 w-20" />
            <Sk className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
        <div className="border-b border-(--admin-edge) px-5 py-3 flex gap-6">
          {['w-28', 'w-36', 'w-24', 'w-20', 'w-20'].map((w, i) => (
            <Sk key={i} className={`h-3.5 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4 border-b border-(--admin-edge) last:border-0">
            <Sk className="h-4 w-24" />
            <Sk className="h-4 w-32" />
            <Sk className="h-4 w-20" />
            <Sk className="h-5 w-18 rounded-full" />
            <Sk className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
