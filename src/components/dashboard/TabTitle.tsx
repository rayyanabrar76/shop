'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getStoreNav } from '@/lib/admin-nav'

/**
 * Renames the tab the moment a link is clicked, rather than a beat later.
 *
 * The page titles themselves come from `generateMetadata`, which is right:
 * it works without JavaScript and it is what a hard load and a bookmark use.
 * But it has to reach the database for the shop's name, and the browser puts
 * the new URL in the tab while it waits. On a click that reads as the title
 * flickering to a long localhost path and back.
 *
 * So the tab is renamed here first, from what is already known on the client:
 * the shop name is a prop that survives navigation inside the shop, and the
 * page name comes from the same nav table the sidebar reads. The server's
 * title lands a moment later and agrees, or improves on it, since a product
 * page resolves "Products" into the product's own title.
 */
export default function TabTitle({ storeId, storeName }: { storeId: string; storeName: string }) {
  const pathname = usePathname()

  useEffect(() => {
    const base = `/dashboard/stores/${storeId}`
    // Longest first, so /settings/payments is not claimed by /settings.
    const match = [...getStoreNav(storeId)]
      .sort((a, b) => b.href.length - a.href.length)
      .find(n => (n.exact ? pathname === n.href : pathname.startsWith(n.href)))

    // Named sections the sidebar does not list, and so does not know about.
    const extra: [string, string][] = [
      [`${base}/theme/editor`, 'Visual editor'],
      [`${base}/products/create`, 'New product'],
      [`${base}/categories/new`, 'New category'],
      [`${base}/settings/domain`, 'Domain'],
    ]
    const named = extra.find(([href]) => pathname.startsWith(href))?.[1] ?? match?.label

    document.title = named ? `${named} · ${storeName} · Shopflow` : `${storeName} · Shopflow`
  }, [pathname, storeId, storeName])

  return null
}
