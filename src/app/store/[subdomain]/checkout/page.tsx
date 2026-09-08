import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CheckoutPage from './CheckoutClient'

/**
 * Checkout wears the shop's own theme.
 *
 * It used to be the one page that did not: hardcoded greys and a black
 * button, on a storefront the merchant had spent an hour colouring. That is
 * the page where a shopper is deciding whether to hand over money, and the
 * moment it stops looking like the shop they were just in is the moment it
 * looks like somewhere else entirely.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

  const store = await prisma.store.findUnique({
    where: { subdomain },
    select: { name: true, theme: { select: { primaryColor: true, borderRadius: true, textColor: true, font: true } } },
  })
  if (!store) notFound()

  const theme = store.theme
  return (
    <CheckoutPage
      params={{ subdomain }}
      storeName={store.name}
      theme={{
        primary: theme?.primaryColor ?? '#0a0a0a',
        radius: theme?.borderRadius ?? '0.75rem',
        textColor: theme?.textColor ?? '#09090b',
        font: theme?.font ?? 'sans',
      }}
    />
  )
}
