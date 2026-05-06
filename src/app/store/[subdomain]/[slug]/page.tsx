import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StorePageClient from './StorePageClient'

export default async function StorePageRenderer({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>
}) {
  const { subdomain, slug } = await params

  const store = await prisma.store.findUnique({
    where: { subdomain },
    include: { theme: true },
  })

  if (!store) notFound()

  const page = await prisma.storePage.findUnique({
    where: { storeId_slug: { storeId: store.id, slug } },
  })

  if (!page) notFound()

  const t = store.theme

  const theme = {
    primaryColor:    t?.primaryColor    ?? '#6c47ff',
    backgroundColor: t?.backgroundColor ?? '#ffffff',
    footerColor:     t?.footerColor     ?? '#f4f4f5',
    accentColor:     t?.accentColor     ?? '#000000',
    textColor:       t?.textColor       ?? '#09090b',
    borderRadius:    t?.borderRadius    ?? '0.75rem',
    buttonStyle:     t?.buttonStyle     ?? 'solid',
    font:            t?.font            ?? 'sans',
    headingFont:     t?.headingFont     ?? 'sans',
    bannerText:      t?.bannerText      ?? '',
    showBanner:      t?.showBanner      ?? false,
    logoUrl:         t?.logoUrl         ?? '',
    logoWidth:       t?.logoWidth       ?? 120,
    footerText:      t?.footerText      ?? '',
    instagramHandle: t?.instagramHandle ?? '',
    twitterHandle:   t?.twitterHandle   ?? '',
    facebookUrl:     t?.facebookUrl     ?? '',
    layout:          t?.layout          ?? 'grid',
    cardShadow:      t?.cardShadow      ?? 'none',
    dividerStyle:    t?.dividerStyle    ?? 'none',
    navLinks:    (t?.navLinks as { label: string; href: string }[] | null) ?? null,
    navFontSize: t?.navFontSize ?? 14,
    navCase:     t?.navCase     ?? 'normal',
    navDividers:     t?.navDividers     ?? false,
    darkMode:        t?.darkMode        ?? false,
    showDarkToggle:  t?.showDarkToggle  ?? true,
  }

  const customSections = await prisma.customSection.findMany({
    where: { storeId: store.id, pageId: page.id },
    orderBy: { position: 'asc' },
  })

  return (
    <StorePageClient
      store={store}
      pageName={page.name}
      pageType={page.type}
      initialContent={page.content ?? {}}
      initialCustomSections={customSections}
      theme={theme}
      subdomain={subdomain}
    />
  )
}
