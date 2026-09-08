import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Names the browser tab after the shop you are working in.
 *
 * Every admin page used to carry the same static title, so a merchant with
 * four tabs open had four identical ones and had to click through them to
 * find the right shop.
 *
 * Page first, then the shop: "Orders · The Donuts Factory · Shopflow".
 *
 * Shopify puts the shop first, and it is right to for the merchant running
 * six of them. Almost nobody here runs six. One shop with four tabs open is
 * the normal case, and a browser truncates a tab from the right, so leading
 * with the shop would give that person four tabs all reading "The Donuts
 * Fa…" and nothing to tell them apart. Leading with the page names each tab
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
  const { userId } = await auth()
  if (!userId) return { title: 'Shopflow' }

  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId: userId } },
    select: { name: true },
  })
  const name = store?.name ?? 'Store'

  return {
    title: {
      template: `%s · ${name} · Shopflow`,
      default: `${name} · Shopflow`,
    },
  }
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children
}
