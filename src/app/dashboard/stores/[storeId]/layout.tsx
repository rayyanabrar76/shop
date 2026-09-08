import { cache } from 'react'
import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import TabTitle from '@/components/dashboard/TabTitle'

/**
 * Looked up once per request, not twice.
 *
 * `generateMetadata` and the layout body both want the shop's name, and
 * without this they would each make the same query on every navigation.
 */
const storeName = cache(async (storeId: string) => {
  const { userId } = await auth()
  if (!userId) return null
  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId: userId } },
    select: { name: true },
  })
  return store?.name ?? null
})

/**
 * Names the browser tab after the page and the shop it is in.
 *
 * Every admin page used to carry the same static title, so four open tabs
 * looked identical and had to be clicked through to tell apart.
 *
 * Page first, then the shop: "Orders · The Donuts Factory · Shopflow".
 * Shopify leads with the shop, and it is right to for the merchant running
 * six of them. Almost nobody here runs six. One shop with four tabs open is
 * the normal case, and a browser truncates a tab from the right, so leading
 * with the shop would give that person four tabs all reading "The Donuts
 * Fa…" with nothing to tell them apart. Leading with the page names each tab
 * by the only thing that actually differs between them.
 *
 * The template is set here rather than on each page, so a page only has to
 * say its own name. A page that says nothing still gets the shop's name from
 * `default`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeId: string }>
}): Promise<Metadata> {
  const { storeId } = await params
  const name = (await storeName(storeId)) ?? 'Store'

  return {
    title: {
      template: `%s · ${name} · Shopflow`,
      default: `${name} · Shopflow`,
    },
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  const name = await storeName(storeId)

  return (
    <>
      {/* Renames the tab on click, before the server's title arrives. Without
          it the browser shows the raw URL for the length of a round trip. */}
      {name && <TabTitle storeId={storeId} storeName={name} />}
      {children}
    </>
  )
}
