'use client'

import { useState } from 'react'
import {
  ChevronRight, ChevronDown,
  Megaphone, Layout, LayoutGrid, Type,
  ShoppingBag, CreditCard, Package, CheckCircle2,
  LogIn, UserPlus, User, Truck, Star, Palette, Filter,
} from 'lucide-react'

type SectionDef = {
  id: string
  label: string
  description: string
  icon: any
  editorView?: string
  info?: string
}

const SYSTEM_PAGE_DEFS: Record<string, SectionDef[]> = {
  products: [
    { id: 'banner',          label: 'Announcement Banner', description: 'Top banner with text',              icon: Megaphone,    editorView: 'banner' },
    { id: 'header',          label: 'Header',              description: 'Logo and navigation links',         icon: Layout,       editorView: 'header' },
    { id: 'products',        label: 'Product Listing',     description: 'Grid layout and card styles',       icon: LayoutGrid,   editorView: 'products' },
    { id: 'category-filter', label: 'Category Filters',   description: 'Tab curvature, font, colors',       icon: Filter,       editorView: 'category-filter' },
    { id: 'footer',          label: 'Footer',              description: 'Footer text and social links',      icon: Type,         editorView: 'footer' },
  ],
  checkout: [
    { id: 'info',     label: 'Customer Details',  description: 'Name, email, address form',   icon: User,
      info: 'Customers fill in their name, email, phone, address and city. Appearance is controlled by your global theme colors.' },
    { id: 'shipping', label: 'Shipping Method',   description: 'Delivery rate options',       icon: Truck,
      info: 'Shows shipping rates you configure in Store Settings → Shipping. Enable or disable rates there.' },
    { id: 'payment',  label: 'Payment Method',    description: 'COD or card payment',         icon: CreditCard,
      info: 'Shows payment options enabled in Store Settings → Payments (Stripe and/or Cash on Delivery).' },
    { id: 'summary',  label: 'Order Summary',     description: 'Cart items and totals',       icon: ShoppingBag,
      info: 'Displays cart items, subtotal, discount codes, shipping cost and total. Automatically populated from the cart.' },
  ],
  success: [
    { id: 'message',  label: 'Success Message',   description: 'Order confirmed heading',     icon: CheckCircle2,
      info: 'Shows a confirmation message with the order number after a successful purchase.' },
    { id: 'details',  label: 'Order Details',     description: 'Items, quantities, total',    icon: Package,
      info: 'Lists the purchased items, their quantities and prices, shipping method, and final total.' },
    { id: 'cta',      label: 'Continue Shopping', description: 'Button back to store',        icon: ShoppingBag,
      info: 'A button that takes the customer back to your storefront to keep shopping.' },
  ],
  login: [
    { id: 'banner',  label: 'Announcement Banner', description: 'Top banner with text',       icon: Megaphone, editorView: 'banner' },
    { id: 'header',  label: 'Header',              description: 'Logo and navigation links',  icon: Layout,    editorView: 'header' },
    { id: 'form',    label: 'Login Form',          description: 'Email and sign-in button',   icon: LogIn,
      info: 'Customers enter their email to receive a magic link, or their password if accounts use passwords.' },
    { id: 'footer',  label: 'Footer',              description: 'Footer text and social links', icon: Type,    editorView: 'footer' },
  ],
  signup: [
    { id: 'banner',  label: 'Announcement Banner', description: 'Top banner with text',       icon: Megaphone, editorView: 'banner' },
    { id: 'header',  label: 'Header',              description: 'Logo and navigation links',  icon: Layout,    editorView: 'header' },
    { id: 'form',    label: 'Sign Up Form',        description: 'Name, email, password',      icon: UserPlus,
      info: 'Customers create an account with their name and email. Colors and fonts follow your global theme.' },
    { id: 'footer',  label: 'Footer',              description: 'Footer text and social links', icon: Type,    editorView: 'footer' },
  ],
  account: [
    { id: 'banner',  label: 'Announcement Banner', description: 'Top banner with text',       icon: Megaphone, editorView: 'banner' },
    { id: 'header',  label: 'Header',              description: 'Logo and navigation links',  icon: Layout,    editorView: 'header' },
    { id: 'profile', label: 'Profile',             description: 'Customer info and settings', icon: User,
      info: 'Shows the customer\'s name, email, and allows them to update their profile details.' },
    { id: 'orders',  label: 'Order History',       description: 'Past orders list',           icon: Package,
      info: 'Displays all previous orders with order number, date, status, and total amount.' },
    { id: 'footer',  label: 'Footer',              description: 'Footer text and social links', icon: Type,    editorView: 'footer' },
  ],
}

const THEME_NOTE = (
  <p className="mt-2 text-[10px] text-zinc-500 leading-relaxed">
    To change colors and fonts, use the <strong className="text-zinc-600 dark:text-zinc-300">Theme</strong> tab above.
  </p>
)

export default function SystemPageEdit({
  slug,
  onSectionClick,
  sendHighlight,
}: {
  slug: string
  onSectionClick: (view: string) => void
  sendHighlight: (section: string) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const sections = SYSTEM_PAGE_DEFS[slug]
  if (!sections) return (
    <div className="p-6 text-center text-xs text-zinc-500">
      <Star className="w-8 h-8 mx-auto mb-2 text-zinc-200 dark:text-zinc-700" />
      <p>No editable sections for this page.</p>
      <p className="mt-1">Use the Theme tab to adjust colors and fonts.</p>
    </div>
  )

  return (
    <div className="p-4 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Page Sections</p>
      {sections.map(section => {
        const Icon = section.icon
        const isExpanded = expanded === section.id
        const hasEditor = !!section.editorView

        return (
          <div key={section.id} className="rounded-xl border border-(--admin-edge) overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-3 py-3 bg-(--admin-card) hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left group"
              onClick={() => {
                if (hasEditor) {
                  onSectionClick(section.editorView!)
                  sendHighlight(section.id)
                } else {
                  setExpanded(isExpanded ? null : section.id)
                  sendHighlight(section.id)
                }
              }}
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors shrink-0">
                <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{section.label}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{section.description}</p>
              </div>
              {hasEditor
                ? <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" />
                : isExpanded
                  ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0" />
              }
            </button>

            {!hasEditor && isExpanded && section.info && (
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-t border-(--admin-edge)">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{section.info}</p>
                {THEME_NOTE}
              </div>
            )}
          </div>
        )
      })}

      <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-(--admin-edge)">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-3.5 h-3.5 text-zinc-500" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Appearance</p>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Colors, fonts, and buttons are global. Switch to the <strong className="text-zinc-600 dark:text-zinc-300">Theme</strong> tab to customize them across all pages.
        </p>
      </div>
    </div>
  )
}
