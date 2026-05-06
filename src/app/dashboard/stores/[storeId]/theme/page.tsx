import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Eye, Paintbrush } from 'lucide-react'

export default async function ThemePage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { theme: true },
  })
  if (!store) notFound()

  const primary = store.theme?.primaryColor ?? '#6c47ff'

  // Calculate if primary color is light or dark to pick contrasting text
  const hex = primary.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const buttonTextColor = luminance > 0.6 ? '#000000' : '#ffffff'
  const buttonTextOpacity = luminance > 0.6 ? 'text-black/70' : 'text-white/70'
  const buttonArrowColor = luminance > 0.6 ? 'text-black/40' : 'text-white/60'
  const iconColor = luminance > 0.6 ? 'text-black' : 'text-white'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 text-center">

        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: `${primary}20` }}>
            <Paintbrush className="w-6 h-6" style={{ color: primary }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Storefront</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Manage how your store looks to customers</p>
        </div>

        <div className="space-y-3">
          {/* View Live Store */}
          <Link
            href={`/store/${store.subdomain}?customerView=1`}
            target="_blank"
            className="flex items-center justify-between w-full px-5 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                <Eye className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">View Live Store</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">See your store as customers see it</p>
              </div>
            </div>
            <span className="text-zinc-300 dark:text-zinc-600 text-lg">→</span>
          </Link>

          {/* Customize — goes to full visual editor */}
          <Link
            href={`/dashboard/stores/${storeId}/theme/editor`}
            className="flex items-center justify-between w-full px-5 py-4 rounded-2xl border transition-all group"
            style={{ backgroundColor: primary, borderColor: primary }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Paintbrush className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: buttonTextColor }}>Customize Your Store</p>
                <p className={`text-xs mt-0.5 ${buttonTextOpacity}`}> sections, theme - live editor</p>
              </div>
            </div>
            <span className={`text-lg ${buttonArrowColor}`}>→</span>
          </Link>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">/store/{store.subdomain}</p>
      </div>
    </div>
  )
}