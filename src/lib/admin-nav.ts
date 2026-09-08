import type { ComponentType } from 'react'
import {
  HiHome, HiCube, HiTag, HiClipboardDocumentList, HiUser, HiChatBubbleLeftRight,
  HiChartBar, HiPaintBrush, HiTruck, HiCreditCard, HiCog6Tooth,
} from 'react-icons/hi2'

export interface NavEntry {
  id: string
  label: string
  href: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  /** Match the route exactly rather than as a prefix (only Home needs it). */
  exact?: boolean
  /** A line under the label in search results. */
  sub?: string
  /** Words the search should answer to for this page, beyond its label. */
  keywords: string[]
}

/**
 * The store's main navigation, in one place.
 *
 * The sidebar renders this list and the admin search indexes it, so a page
 * added here appears in both at once. Before, they were two hand-written
 * copies, and a new section would reach the sidebar and quietly miss the
 * search until someone remembered.
 *
 * Keywords still have to be written by a person: "stripe" finds Payments
 * only because that word is here.
 */
export function getStoreNav(storeId: string): NavEntry[] {
  const base = `/dashboard/stores/${storeId}`
  return [
    { id: 'nav-home', label: 'Home', href: base, icon: HiHome, exact: true,
      keywords: ['dashboard', 'overview', 'start', 'main'] },
    { id: 'nav-products', label: 'Products', href: `${base}/products`, icon: HiCube,
      sub: 'Add and update your products',
      keywords: ['items', 'catalogue', 'catalog', 'inventory', 'stock', 'listings', 'goods'] },
    { id: 'nav-categories', label: 'Categories', href: `${base}/categories`, icon: HiTag,
      keywords: ['collections', 'groups', 'sections', 'organise', 'organize', 'tags'] },
    { id: 'nav-orders', label: 'Orders', href: `${base}/orders`, icon: HiClipboardDocumentList,
      keywords: ['sales', 'purchases', 'checkouts', 'fulfil', 'fulfill', 'shipments', 'invoices'] },
    { id: 'nav-customers', label: 'Customers', href: `${base}/customers`, icon: HiUser,
      keywords: ['buyers', 'shoppers', 'clients', 'people', 'users', 'accounts', 'emails'] },
    { id: 'nav-reviews', label: 'Reviews', href: `${base}/reviews`, icon: HiChatBubbleLeftRight,
      keywords: ['ratings', 'stars', 'feedback', 'testimonials', 'moderate', 'approve'] },
    { id: 'nav-analytics', label: 'Analytics', href: `${base}/analytics`, icon: HiChartBar,
      keywords: ['stats', 'statistics', 'reports', 'revenue', 'traffic', 'insights', 'numbers', 'metrics'] },
    { id: 'nav-theme', label: 'Customization', href: `${base}/theme`, icon: HiPaintBrush,
      sub: 'Edit the look of your store',
      keywords: ['customisation', 'customize', 'customise', 'design', 'storefront', 'look', 'style', 'template'] },
    { id: 'nav-discounts', label: 'Discounts & Shipping', href: `${base}/discounts`, icon: HiTruck,
      keywords: ['delivery', 'postage', 'coupons', 'promo', 'offers'] },
    { id: 'nav-payments', label: 'Payments', href: `${base}/settings/payments`, icon: HiCreditCard,
      keywords: ['stripe', 'card', 'cards', 'cash on delivery', 'cod', 'checkout', 'payment methods', 'payouts', 'pay'] },
    { id: 'nav-settings', label: 'Settings', href: `${base}/settings`, icon: HiCog6Tooth,
      keywords: ['preferences', 'options', 'configuration', 'config', 'setup', 'admin'] },
  ]
}
