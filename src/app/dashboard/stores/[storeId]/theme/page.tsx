import { prisma } from '@/lib/prisma'
import { storeUrl } from '@/lib/config'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Paintbrush } from 'lucide-react'
import PageHeader from '@/components/dashboard/PageHeader'
import ThemeClient from './ThemeClient'

export const metadata = { title: 'Customization' }

export default async function ThemePage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId } },
    include: {
      theme: true,
      _count: { select: { pages: true, products: true } },
    },
  })
  if (!store) notFound()

  // Home page sections only. The ones attached to a custom page belong to that
  // page, and counting them here would credit the home page with blocks that
  // are not on it.
  const sectionCount = await prisma.customSection.count({
    where: { storeId, pageId: null, visible: true },
  })

  const t = store.theme
  const slides = Array.isArray(t?.heroSlides) ? (t!.heroSlides as unknown[]) : null
  const nav = Array.isArray(t?.navLinks) ? (t!.navLinks as unknown[]) : null

  return (
    <div className="min-h-full bg-(--admin-page)">
      <PageHeader
        storeId={storeId}
        maxWidth="max-w-5xl"
        icon={<Paintbrush className="w-5 h-5" />}
        title="Customization"
        action={
          <Link
            href={`/dashboard/stores/${storeId}/theme/editor`}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 text-[11.5px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            <Paintbrush className="w-3.5 h-3.5" /> Customise
          </Link>
        }
      />

      <ThemeClient
        storeId={storeId}
        storeName={store.name}
        // customerView keeps the owner's preview bar out of the frame; the
        // storefront hides it inside an iframe anyway, and this is belt and
        // braces for a preview that is meant to look like the shop.
        previewUrl={`/store/${store.subdomain}?customerView=1`}
        liveUrl={storeUrl(store.subdomain, '?customerView=1')}
        displayUrl={storeUrl(store.subdomain).replace(/^https?:\/\//, '')}
        facts={{
          primaryColor: t?.primaryColor ?? '#0a0a0a',
          palette: {
            page:    t?.backgroundColor ?? '#ffffff',
            footer:  t?.footerColor     ?? '#ffffff',
            text:    t?.textColor       ?? '#09090b',
            primary: t?.primaryColor    ?? '#0a0a0a',
            accent:  t?.accentColor     ?? '#000000',
          },
          headingFont: t?.headingFont ?? 'serif',
          font:        t?.font        ?? 'sans',
          showBanner:  t?.showBanner  ?? false,
          bannerText:  t?.bannerText  ?? '',
          hasLogo:     !!t?.logoUrl,
          navLinkCount: nav ? nav.length : null,
          // No saved slides means the storefront shows its two defaults.
          heroSlideCount: slides ? slides.length : 2,
          layout:       t?.layout ?? 'grid',
          productCount: store._count.products,
          sectionCount,
          newsletter:   t?.footerNewsletter ?? true,
          pageCount:    store._count.pages,
          seoTitleSet:  !!t?.seoTitle?.trim(),
          faviconSet:   !!t?.faviconUrl,
          customCode:   !!(t?.customCss?.trim() || t?.customHead?.trim()),
        }}
      />
    </div>
  )
}
