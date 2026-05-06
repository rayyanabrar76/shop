import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import StoreBanner from '../StoreBanner'
import StoreHeader from '../StoreHeader'
import StoreFooter from '../StoreFooter'
import CartSidebar from '../cart-sidebar'
import ForgotPasswordForm from './ForgotPasswordForm'

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { subdomain } = await params
  const { token } = await searchParams

  const store = await prisma.store.findUnique({
    where: { subdomain },
    include: { theme: true },
  })
  if (!store) notFound()

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
      <StoreBanner theme={theme} />
      <StoreHeader store={store} theme={theme} subdomain={subdomain} />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <ForgotPasswordForm subdomain={subdomain} theme={theme} resetToken={token} />
      </main>
      <StoreFooter store={store} theme={theme} />
      <CartSidebar themeStyle={{ primaryColor: theme.primaryColor, borderRadius: theme.borderRadius, buttonStyle: theme.buttonStyle }} subdomain={subdomain} />
    </div>
  )
}
