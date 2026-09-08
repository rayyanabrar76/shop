import { prisma } from '@/lib/prisma'
import { storeUrl } from '@/lib/config'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Eye, Paintbrush } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'

export const metadata = { title: 'Customization' }

export default async function ThemePage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({ where: { id: storeId, owner: { clerkId } },
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
    <div className="min-h-full bg-(--admin-page)">
      <PageHeader
        storeId={storeId}
        maxWidth="max-w-2xl"
        icon={<Paintbrush className="w-5 h-5" />}
        title="Customization"
      />

      {/* Left-aligned like every other section now, rather than a centred
          card floating in the middle of the page. */}
      <div className="w-full max-w-2xl mx-auto px-6 pb-10 space-y-4">

        <div className="space-y-3">
          {/* View Live Store */}
          <Link
            href={storeUrl(store.subdomain, '?customerView=1')}
            target="_blank"
            className="flex items-center justify-between w-full px-5 py-4 bg-(--admin-card) rounded-2xl border border-(--admin-border) hover:border-(--admin-border) hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                <Eye className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">View Live Store</p>
                <p className="text-xs text-zinc-500 mt-0.5">See your store as customers see it</p>
              </div>
            </div>
            <span className="text-zinc-300 dark:text-zinc-600 text-lg">→</span>
          </Link>

          {/* Customize, goes to full visual editor.
              The border is deliberately not the primary colour: this card is
              filled with the store's own colour, so a black theme on the dark
              admin page gave a black card a black border and the edge vanished.
              A theme-derived hairline always has something to contrast with. */}
          <Link
            href={`/dashboard/stores/${storeId}/theme/editor`}
            className="flex items-center justify-between w-full px-5 py-4 rounded-2xl border border-(--admin-border) shadow-sm hover:shadow-md transition-all group"
            style={{ backgroundColor: primary }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Paintbrush className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: buttonTextColor }}>Customize Your Store</p>
                <p className={`text-xs mt-0.5 ${buttonTextOpacity}`}>sections, theme - live editor</p>
              </div>
            </div>
            <span className={`text-lg ${buttonArrowColor}`}>→</span>
          </Link>
        </div>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 font-mono">{storeUrl(store.subdomain).replace(/^https?:\/\//, '')}</p>
      </div>
    </div>
  )
}