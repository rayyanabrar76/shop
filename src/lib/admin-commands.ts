import type { ComponentType } from 'react'
import { getStoreNav } from './admin-nav'
import {
  Palette, Wand2, Truck, Sun, Moon, Monitor, Globe, ShieldAlert, Coins, Store, Search, PanelTop, Megaphone, PanelBottom, LayoutGrid, Type, Plus, Download, Star, Ticket, Image as ImageIcon,
} from 'lucide-react'

/** Either icon family fits: lucide's outlines and Heroicons' solids both
    take a className and ignore what they do not understand. */
export type CommandIcon = ComponentType<{ className?: string; strokeWidth?: number }>

/**
 * Everything the admin search can take you to, with the words people use
 * for it.
 *
 * A search that only matches page titles fails the person who types "dark"
 * looking for the theme switch, or "stripe" looking for payments, or "logo"
 * looking for the header section of the editor. Each entry therefore carries
 * the vocabulary a merchant might actually reach for, including the
 * misspellings and the American and British spellings, and the scorer
 * matches against all of it.
 *
 * Some entries are actions rather than places. "Use dark theme" applies the
 * theme on Enter; it does not open a page where you then do it.
 */

export type CommandGroup = 'Navigation' | 'Settings' | 'Actions' | 'Customization'

export interface Command {
  id: string
  group: CommandGroup
  label: string
  sub?: string
  keywords: string[]
  href?: string
  /** Opened in a new tab or handed to the browser, not the router. */
  external?: boolean
  /** Performed immediately instead of navigating. */
  action?: 'theme:dark' | 'theme:light' | 'theme:system'
  icon: CommandIcon
}

export function buildCommands(storeId: string): Command[] {
  const base = `/dashboard/stores/${storeId}`
  const settings = `${base}/settings`
  const editor = `${base}/theme/editor`

  return [
    // ── Navigation: the sidebar's own list, so the two cannot drift ─────
    ...getStoreNav(storeId).map(n => ({
      id: n.id, group: 'Navigation' as const, label: n.label, sub: n.sub,
      href: n.href, icon: n.icon, keywords: n.keywords,
    })),
    { id: 'nav-editor', group: 'Navigation', label: 'Visual editor', icon: Wand2, href: editor,
      keywords: ['theme editor', 'page builder', 'edit store', 'edit site', 'preview', 'live editor', 'builder'] },

    // ── Settings, one level deeper ──────────────────────────────────────
    { id: 'set-appearance', group: 'Settings', label: 'Appearance', icon: Palette, href: `${settings}?section=appearance`,
      sub: 'Light, dark or system theme for the admin',
      keywords: ['theme', 'themes', 'dark', 'light', 'dark mode', 'light mode', 'night mode', 'system',
        'colour scheme', 'color scheme', 'admin theme', 'dashboard theme', 'display', 'look and feel', 'skin'] },
    { id: 'set-general', group: 'Settings', label: 'General settings', icon: Store, href: `${settings}?section=general`,
      sub: 'Store name, currency and country',
      keywords: ['store name', 'shop name', 'rename', 'country', 'region', 'store id', 'general'] },
    { id: 'set-currency', group: 'Settings', label: 'Store currency', icon: Coins, href: `${settings}?section=general`,
      sub: 'The currency every price is shown and charged in',
      keywords: ['currency', 'money', 'pkr', 'usd', 'eur', 'gbp', 'rupee', 'dollar', 'euro', 'pound', 'price format',
        'change currency'] },
    { id: 'set-domain', group: 'Settings', label: 'Domain & URL', icon: Globe, href: `${settings}?section=domain`,
      sub: 'Your store address and custom domain',
      keywords: ['domain', 'custom domain', 'subdomain', 'url', 'address', 'dns', 'connect domain', 'www',
        'website address', 'link', 'my site url'] },
    { id: 'set-danger', group: 'Settings', label: 'Danger zone', icon: ShieldAlert, href: `${settings}?section=danger`,
      sub: 'Delete this store',
      keywords: ['delete store', 'remove store', 'close store', 'destroy', 'danger', 'delete account'] },
    { id: 'set-favicon', group: 'Settings', label: 'Favicon', icon: ImageIcon, href: `${editor}?section=seo&field=favicon`,
      sub: 'The small mark in the browser tab',
      keywords: ['favicon', 'tab icon', 'browser icon', 'site icon', 'small logo'] },

    // ── Actions: applied on Enter ───────────────────────────────────────
    { id: 'act-dark', group: 'Actions', label: 'Use dark theme', icon: Moon, action: 'theme:dark',
      sub: 'Switches the admin to dark now',
      keywords: ['dark', 'dark mode', 'dark theme', 'night', 'night mode', 'switch to dark', 'enable dark',
        'turn on dark', 'black theme', 'go dark'] },
    { id: 'act-light', group: 'Actions', label: 'Use light theme', icon: Sun, action: 'theme:light',
      sub: 'Switches the admin to light now',
      keywords: ['light', 'light mode', 'light theme', 'day', 'day mode', 'switch to light', 'white theme',
        'bright', 'go light'] },
    { id: 'act-system', group: 'Actions', label: 'Match system theme', icon: Monitor, action: 'theme:system',
      sub: 'Follows your device setting',
      keywords: ['system', 'system theme', 'auto', 'automatic', 'follow system', 'device theme', 'os theme'] },
    { id: 'act-add-product', group: 'Actions', label: 'Add a product', icon: Plus, href: `${base}/products/create`,
      keywords: ['new product', 'create product', 'add item', 'add product', 'upload product', 'list a product'] },
    { id: 'act-add-category', group: 'Actions', label: 'Create a category', icon: Plus, href: `${base}/categories/new`,
      keywords: ['new category', 'add category', 'new collection', 'create collection', 'group products'] },
    { id: 'act-export-orders', group: 'Actions', label: 'Export orders to CSV', icon: Download,
      href: `/api/stores/${storeId}/orders/export`, external: true,
      keywords: ['export', 'csv', 'download orders', 'spreadsheet', 'excel', 'export sales'] },
    { id: 'act-pending-reviews', group: 'Actions', label: 'Approve pending reviews', icon: Star, href: `${base}/reviews`,
      keywords: ['pending reviews', 'approve', 'moderate reviews', 'publish reviews', 'new reviews'] },
    { id: 'act-discount', group: 'Actions', label: 'Create a discount code', icon: Ticket, href: `${base}/discounts`,
      keywords: ['coupon', 'promo code', 'discount code', 'voucher', 'sale', 'percent off', 'offer code'] },
    { id: 'act-shipping', group: 'Actions', label: 'Set shipping rates', icon: Truck, href: `${base}/discounts`,
      keywords: ['shipping', 'delivery', 'shipping rates', 'delivery fee', 'postage', 'free shipping', 'courier'] },

    // ── Customization: straight into the editor's panels ────────────────
    { id: 'cus-header', group: 'Customization', label: 'Header & logo', icon: PanelTop,
      href: `${editor}?section=header&field=header-logo`,
      sub: 'Store logo and navigation menu',
      keywords: ['logo', 'store logo', 'header', 'navigation', 'nav', 'menu', 'top bar', 'brand', 'upload logo',
        'change logo', 'site logo'] },
    { id: 'cus-hero', group: 'Customization', label: 'Hero', icon: LayoutGrid, href: `${editor}?section=hero`,
      sub: 'The big banner at the top of the home page',
      keywords: ['hero', 'hero image', 'banner', 'slider', 'slides', 'carousel', 'cover', 'homepage image',
        'main image', 'headline'] },
    { id: 'cus-banner', group: 'Customization', label: 'Announcement bar', icon: Megaphone, href: `${editor}?section=banner`,
      sub: 'The line across the very top of the store',
      keywords: ['announcement', 'announcement bar', 'top banner', 'promo bar', 'notice', 'ticker', 'free shipping bar'] },
    { id: 'cus-products', group: 'Customization', label: 'Product grid', icon: LayoutGrid, href: `${editor}?section=products`,
      sub: 'How products are laid out on the home page',
      keywords: ['product grid', 'featured products', 'grid', 'carousel', 'layout', 'columns', 'product cards',
        'add to cart button'] },
    { id: 'cus-footer', group: 'Customization', label: 'Footer', icon: PanelBottom, href: `${editor}?section=footer`,
      keywords: ['footer', 'bottom', 'newsletter', 'footer links', 'copyright', 'social links'] },
    { id: 'cus-seo', group: 'Customization', label: 'SEO & search listing', icon: Search, href: `${editor}?section=seo`,
      sub: 'How the shop appears in Google and the tab',
      keywords: ['seo', 'google', 'meta', 'meta title', 'meta description', 'search engine', 'title tag',
        'ranking', 'search listing'] },
    { id: 'cus-fonts', group: 'Customization', label: 'Colours & fonts', icon: Type, href: editor,
      sub: 'Brand colour, typography, corners',
      keywords: ['colors', 'colours', 'fonts', 'typography', 'font', 'brand color', 'brand colour', 'primary color',
        'accent', 'rounded corners', 'radius', 'style'] },
  ]
}

/** The shape any searchable row must offer the scorer. */
export interface Searchable {
  label: string
  sub?: string
  keywords?: string[]
}

/**
 * Scores a row against the query's words. Zero means "does not match".
 *
 * Every word must land somewhere (so "dark theme" wants both "dark" and
 * "theme" to hit, which is what keeps "Use light theme" from ranking for
 * it), and where a word lands decides how much it is worth: the label beats
 * a keyword beats the description, and the start of a word beats its middle.
 * A phrase match on the whole query on top of that pulls the obvious answer
 * to the top when several rows share the words.
 */
export function scoreText(row: Searchable, tokens: string[]): number {
  if (tokens.length === 0) return 1
  const label = row.label.toLowerCase()
  const sub = (row.sub ?? '').toLowerCase()
  const keywords = (row.keywords ?? []).map(k => k.toLowerCase())
  const labelWords = label.split(/[^a-z0-9]+/).filter(Boolean)

  let total = 0
  for (const t of tokens) {
    let best = 0
    if (label === t) best = 100
    else if (label.startsWith(t)) best = 80
    else if (labelWords.some(w => w.startsWith(t))) best = 70
    else if (label.includes(t)) best = 50

    for (const k of keywords) {
      let v = 0
      if (k === t) v = 60
      else if (k.startsWith(t)) v = 46
      else if (k.split(/[^a-z0-9]+/).some(w => w.startsWith(t))) v = 42
      else if (k.includes(t)) v = 30
      if (v > best) best = v
    }

    if (best === 0 && sub.includes(t)) best = 15
    if (best === 0) return 0
    total += best
  }

  const phrase = tokens.join(' ')
  if (tokens.length > 1) {
    if (label.includes(phrase)) total += 40
    else if (keywords.some(k => k.includes(phrase))) total += 25
  }
  return total
}
