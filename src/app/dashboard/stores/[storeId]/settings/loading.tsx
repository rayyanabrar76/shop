import { Sk } from '@/components/ui/Skeleton'

function SettingsSection({ rows = 3, label = true }: { rows?: number; label?: boolean }) {
  return (
    <div className="rounded-2xl border border-(--admin-border) bg-(--admin-card) p-6 space-y-5">
      {label && <Sk className="h-5 w-32 mb-2" />}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Sk className="h-3.5 w-24" />
          <Sk className="h-10 w-full" />
        </div>
      ))}
      <Sk className="h-10 w-28 mt-2" />
    </div>
  )
}

export default function SettingsLoading() {
  return (
    <div className="px-6 pt-8 pb-10 max-w-2xl space-y-6">
      <div className="space-y-2 mb-2">
        <Sk className="h-7 w-28" />
        <Sk className="h-4 w-56" />
      </div>
      <SettingsSection rows={3} />
      <SettingsSection rows={2} />
      <SettingsSection rows={1} />
    </div>
  )
}
