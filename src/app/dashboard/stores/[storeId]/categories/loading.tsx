import { Sk } from '@/components/ui/Skeleton'

export default function CategoriesLoading() {
  return (
    <div className="px-6 pt-8 pb-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Sk className="h-7 w-36" />
          <Sk className="h-4 w-52" />
        </div>
      </div>

      {/* Create form skeleton */}
      <div className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-5 mb-6 space-y-4">
        <Sk className="h-5 w-32" />
        <div className="flex gap-3">
          <Sk className="h-10 flex-1" />
          <Sk className="h-10 w-28" />
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-(--admin-edge) last:border-0">
            <div className="space-y-1.5">
              <Sk className="h-4 w-28" />
              <Sk className="h-3 w-20" />
            </div>
            <div className="flex gap-2">
              <Sk className="h-8 w-16 rounded-lg" />
              <Sk className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
