import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { verifyCustomerToken, COOKIE_NAME } from '@/lib/store-auth'
import StoreBanner from '../StoreBanner'
import StoreHeader from '../StoreHeader'
import StoreFooter from '../StoreFooter'
import CartSidebar from '../cart-sidebar'
import AccountClient from './AccountClient'
import DarkModeSync from '../DarkModeSync'

export default async function AccountPage({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) redirect(`/store/${subdomain}/login?redirect=/store/${subdomain}/account`)

  const payload = await verifyCustomerToken(token)
  if (!payload || payload.subdomain !== subdomain) {
    redirect(`/store/${subdomain}/login?redirect=/store/${subdomain}/account`)
  }

  const store = await prisma.store.findUnique({
    where: { subdomain },
    include: { theme: true },
  })
  if (!store) notFound()

  const customer = await prisma.storeCustomer.findUnique({
    where: { id: payload.customerId },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  })
  if (!customer) redirect(`/store/${subdomain}/login`)

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

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--store-bg)',
        color: 'var(--store-text)',
        fontFamily: theme.font === 'serif' ? 'serif' : theme.font === 'mono' ? 'monospace' : 'inherit',
      }}
    >
      <DarkModeSync />
      <StoreBanner theme={theme} />
      <StoreHeader store={store} theme={theme} subdomain={subdomain} />
      <main className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">
        <AccountClient customer={customer} subdomain={subdomain} theme={theme} />
      </main>
      <StoreFooter store={store} theme={theme} />
      <CartSidebar themeStyle={{ primaryColor: theme.primaryColor, borderRadius: theme.borderRadius, buttonStyle: theme.buttonStyle }} subdomain={subdomain} />
    </div>
  )
}
