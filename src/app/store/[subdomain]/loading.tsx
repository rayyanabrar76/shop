export default function StorefrontLoading() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--store-bg)' }}>
      {/* Header */}
      <div className="h-[65px] border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.92)' }} />

      {/* Hero */}
      <div className="h-[420px] animate-pulse bg-zinc-100" />

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-zinc-100 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-zinc-100">
              <div className="aspect-square animate-pulse bg-zinc-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-100" />
                <div className="h-4 w-1/3 animate-pulse rounded-md bg-zinc-100" />
                <div className="h-9 w-full animate-pulse rounded-xl bg-zinc-100 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
