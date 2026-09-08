import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StorePageClient from './StorePageClient'
import { POLICY_BY_SLUG, isPolicyPublished } from '@/lib/policies'

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

  // Not a page? It may be a policy. The four legal pages became policies and
  // kept their addresses, so a link a shop shared before still resolves. A
  // policy that is unwritten or hidden is simply not here.
  const policyDef = page ? null : POLICY_BY_SLUG[slug]
  const policy = policyDef
    ? await prisma.storePolicy.findUnique({ where: { storeId_kind: { storeId: store.id, kind: policyDef.kind } } })
    : null
  const policyLive = !!(policyDef && policy &&
    isPolicyPublished({ kind: policyDef.kind, content: policy.content, visible: policy.visible }))
  if (!page && !policyLive) notFound()

  const t = store.theme

  const theme = {
    primaryColor:    t?.primaryColor    ?? '#0a0a0a',
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
    logoHeight:       t?.logoHeight       ?? 48,
    headerLayout:       t?.headerLayout       ?? 'left',
    menuPosition: t?.menuPosition ?? 'auto',
    headerWidth: t?.headerWidth ?? 'page',
    headerHeight: t?.headerHeight ?? 'standard',
    headerSticky: t?.headerSticky ?? true,
    headerBorderWidth: t?.headerBorderWidth ?? 1,
    headerBgColor: t?.headerBgColor ?? '',
    headerTextColor: t?.headerTextColor ?? '',
    utilityStyle: t?.utilityStyle ?? 'icons',
    headerTransparent: t?.headerTransparent ?? false,
    headerInverseLogoUrl: t?.headerInverseLogoUrl ?? '',
    headerTransparentText: t?.headerTransparentText ?? '#ffffff',
    footerText:      t?.footerText      ?? '',
    footerLogoUrl:      t?.footerLogoUrl      ?? '',
    footerLogoWidth:      t?.footerLogoWidth      ?? 130,
    footerLogoHeight:      t?.footerLogoHeight      ?? 56,
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
  }

  const customSections = page
    ? await prisma.customSection.findMany({
        where: { storeId: store.id, pageId: page.id },
        orderBy: { position: 'asc' },
      })
    : []

  // A policy renders through the same plain-text page the old policy pages
  // used, under a type of its own so the editor does not mistake it for one.
  const pageName = page ? page.name : policy!.title
  const pageType = page ? page.type : 'policy'
  const initialContent = page ? (page.content ?? {}) : { heading: policy!.title, content: policy!.content }

  return (
    <StorePageClient
      store={store}
      pageName={pageName}
      pageType={pageType}
      initialContent={initialContent}
      initialCustomSections={customSections}
      theme={theme}
      subdomain={subdomain}
    />
  )
}
