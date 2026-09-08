import { Sk } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="px-6 pt-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-7 w-36" />
          <Sk className="h-4 w-64" />
        </div>
        <Sk className="h-9 w-32" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-5 space-y-4">
            <Sk className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Sk className="h-5 w-32" />
              <Sk className="h-3 w-44" />
            </div>
            <Sk className="h-4 w-28 mt-4" />
          </div>
        ))}
      </div>
    </div>
  )
}
