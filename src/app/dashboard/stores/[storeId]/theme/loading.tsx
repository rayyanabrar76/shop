import { Sk } from '@/components/ui/Skeleton'

export default function ThemeLoading() {
  return (
    <div className="px-6 pt-8 pb-10 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Sk className="h-7 w-32" />
          <Sk className="h-4 w-60" />
        </div>
        <Sk className="h-10 w-36" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-(--admin-border) bg-(--admin-card) overflow-hidden">
            <Sk className="h-44 w-full rounded-none" />
            <div className="p-4 space-y-2">
              <Sk className="h-5 w-24" />
              <Sk className="h-3 w-36" />
              <Sk className="h-9 w-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
