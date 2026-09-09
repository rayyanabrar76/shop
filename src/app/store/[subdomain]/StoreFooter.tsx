'use client'

import { useEffect, useState } from 'react'
import { Instagram, Twitter, Facebook, ArrowRight, Check } from 'lucide-react'
import { readableText, readableBorder, isDark } from '@/lib/contrast'
import { useStoreBase } from '@/components/StoreBaseProvider'
import { EditorItem, useIsEditor, notifyEdit } from './EditorHighlight'

export interface FooterLink {
  label: string
  href: string
}

interface StoreFooterProps {
  store: { name: string }
  theme: {
    footerColor?: string | null
    footerText?: string | null
    logoUrl?: string | null
    footerLogoUrl?: string | null
    footerLogoWidth?: number | null
    footerLogoHeight?: number | null
    instagramHandle?: string | null
    twitterHandle?: string | null
    facebookUrl?: string | null
    footerNewsletter?: boolean | null
    footerNewsletterHeading?: string | null
    footerNewsletterText?: string | null
    footerShowLinks?: boolean | null
  } | null
  subdomain?: string
  /** Category tiles, shown as a Shop column. */
  categories?: { name: string; slug: string }[]
  /** The store's own pages — policies, about, contact. */
  pages?: FooterLink[]
  showShopflowBranding?: boolean
  isEditor?: boolean
  onEdit?: (s: string) => void
}

function SocialLink({ isEditor, href, label, children }: {
  isEditor: boolean
  href: string
  label: string
  children: React.ReactNode
}) {
  if (isEditor) {
    return (
      <span className="hover:opacity-50 transition-opacity cursor-default" aria-label={label}>
        {children}
      </span>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:opacity-50 transition-opacity" aria-label={label}>
      {children}
    </a>
  )
}

/** Signs someone up without taking them away from the page. */
function Newsletter({
  subdomain,
  heading,
  text,
  isEditor,
  dark,
  border,
}: {
  subdomain: string
  heading: string
  text: string
  isEditor: boolean
  dark: boolean
  border: string
}) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    // In the editor this is a preview, not a working form.
    if (isEditor || state === 'sending') return
    setState('sending')
    setError('')
    try {
      const res = await fetch(`/api/storefront/${subdomain}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Could not sign you up.')
      setState('done')
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you up.')
      setState('idle')
    }
  }

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-60 mb-3">{heading}</p>
      {text && <p className="text-sm opacity-60 mb-4 leading-relaxed max-w-xs">{text}</p>}

      {state === 'done' ? (
        <p className="flex items-center gap-2 text-sm font-medium">
          <Check className="w-4 h-4 shrink-0" /> Thanks, you are on the list.
        </p>
      ) : (
        <form onSubmit={submit} className="flex items-center gap-0 max-w-xs">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1 min-w-0 bg-transparent border px-3 py-2.5 text-sm outline-none transition-colors placeholder:opacity-40 focus:border-current"
            // borderRightWidth, not the borderRight shorthand: setting a
            // shorthand beside the borderColor longhand makes React warn, and
            // whichever is applied second silently wins.
            style={{ borderColor: border, borderRightWidth: 0 }}
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            aria-label="Subscribe"
            className="px-3.5 py-2.5 border transition-opacity hover:opacity-80 disabled:opacity-50 shrink-0"
            style={{
              borderColor: border,
              backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {error && <p className="text-xs mt-2 opacity-70">{error}</p>}
    </div>
  )
}

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  if (links.length === 0) return null
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-60 mb-3">{title}</p>
      <ul className="space-y-2">
        {links.map(l => (
          <li key={l.href + l.label}>
            <a href={l.href} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function StoreFooter({
  store,
  theme,
  subdomain = '',
  categories = [],
  pages = [],
  showShopflowBranding = false,
  isEditor: isEditorProp,
  onEdit,
}: StoreFooterProps) {
  // Same as the header: a page rendered straight from the server hands nothing
  // down, so the footer works out for itself whether it is being edited.
  const detected = useIsEditor()
  const isEditor = isEditorProp ?? detected
  const notify = onEdit ?? notifyEdit
  const storeBase = useStoreBase()

  // Falls back to the header logo, so setting a logo once covers both. A
  // footer-specific upload overrides it — useful when the header mark is
  // horizontal and the footer wants the stacked version.
  const footerLogo = theme?.footerLogoUrl || theme?.logoUrl || ''

  const bg = theme?.footerColor ?? '#f4f4f5'
  const dark = isDark(bg)
  const border = readableBorder(bg)

  const showLinks = theme?.footerShowLinks !== false
  const showNewsletter = theme?.footerNewsletter !== false

  // The footer appears on every page, so rather than thread the same two lists
  // through all of them it fetches its own once. Callers that already hold the
  // data can pass it and skip the request.
  const [fetched, setFetched] = useState<{
    categories: { name: string; slug: string }[]
    pages: FooterLink[]
  } | null>(null)

  // Either list being absent is reason enough to fetch: callers pass categories
  // but never pages, so requiring both to be empty meant pages never loaded.
  const needsFetch = showLinks && !!subdomain && (categories.length === 0 || pages.length === 0)

  useEffect(() => {
    if (!needsFetch) return
    let cancelled = false
    fetch(`/api/storefront/${subdomain}/footer`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d) return
        setFetched({
          categories: d.categories ?? [],
          // Pages first, then policies, which is the order a shopper scans
          // an Information column: what the shop says about itself, then the
          // small print.
          pages: [...(d.pages ?? []), ...(d.policies ?? [])].map((pg: { name: string; slug: string }) => ({
            label: pg.name,
            href: `${storeBase}/${pg.slug}`,
          })),
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [needsFetch, subdomain, storeBase])

  const liveCategories = categories.length > 0 ? categories : (fetched?.categories ?? [])
  const livePages = pages.length > 0 ? pages : (fetched?.pages ?? [])

  const shopLinks: FooterLink[] = showLinks
    ? [
        { label: 'All products', href: `${storeBase}/products` },
        ...liveCategories.slice(0, 5).map(c => ({
          label: c.name,
          href: `${storeBase}/categories/${c.slug}`,
        })),
      ]
    : []

  // The shop's own pages, whatever it has made — policies, about, contact.
  const infoLinks: FooterLink[] = showLinks ? livePages : []

  const hasColumns = shopLinks.length > 0 || infoLinks.length > 0 || showNewsletter

  return (
    <footer
      className="mt-auto px-6 md:px-10 pt-14 pb-8 border-t"
      // The footer background is set independently of the page, so its text
      // has to follow it rather than the page's.
      style={{
        backgroundColor: 'var(--store-footer, ' + bg + ')',
        color: readableText(bg, '#ffffff', 'inherit'),
        borderColor: border,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className={`grid gap-10 ${
            hasColumns
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]'
              : 'grid-cols-1'
          }`}
        >
          {/* Brand */}
          <div className="min-w-0">
            <EditorItem section="footer" field="footer-logo" label="Footer logo" isEditor={isEditor} onEdit={notify} block>
              {/* storeBase is "" on a shop's own domain, and href="" would mean
                  "this page" rather than the home page. */}
              <a href={storeBase || '/'} className="inline-block hover:opacity-80 transition-opacity">
                {footerLogo ? (
                  <img
                    src={footerLogo}
                    alt={store.name}
                    style={{ maxWidth: theme?.footerLogoWidth ?? 130, maxHeight: theme?.footerLogoHeight ?? 56 }}
                    className="w-auto h-auto object-contain"
                  />
                ) : (
                  <p className="font-bold text-lg">{store.name}</p>
                )}
              </a>
            </EditorItem>

            <EditorItem section="footer" field="footer-text" label="Footer text" isEditor={isEditor} onEdit={notify} block>
              <p className="text-sm opacity-60 mt-3 leading-relaxed max-w-xs">
                {theme?.footerText || `Thanks for shopping with ${store.name}.`}
              </p>
            </EditorItem>

            {(theme?.instagramHandle || theme?.twitterHandle || theme?.facebookUrl) && (
              <div className="flex items-center gap-4 mt-5">
                {theme?.instagramHandle && (
                  <EditorItem section="footer" field="footer-instagram" label="Instagram" isEditor={isEditor} onEdit={notify}>
                    <SocialLink isEditor={isEditor} href={`https://instagram.com/${theme.instagramHandle}`} label="Instagram">
                      <Instagram className="w-4.5 h-4.5" />
                    </SocialLink>
                  </EditorItem>
                )}
                {theme?.twitterHandle && (
                  <EditorItem section="footer" field="footer-twitter" label="Twitter" isEditor={isEditor} onEdit={notify}>
                    <SocialLink isEditor={isEditor} href={`https://twitter.com/${theme.twitterHandle}`} label="Twitter">
                      <Twitter className="w-4.5 h-4.5" />
                    </SocialLink>
                  </EditorItem>
                )}
                {theme?.facebookUrl && (
                  <EditorItem section="footer" field="footer-facebook" label="Facebook" isEditor={isEditor} onEdit={notify}>
                    <SocialLink isEditor={isEditor} href={theme.facebookUrl} label="Facebook">
                      <Facebook className="w-4.5 h-4.5" />
                    </SocialLink>
                  </EditorItem>
                )}
              </div>
            )}
          </div>

          <LinkColumn title="Shop" links={shopLinks} />
          <LinkColumn title="Information" links={infoLinks} />

          {showNewsletter && (
            <EditorItem section="footer" field="footer-newsletter" label="Newsletter" isEditor={isEditor} onEdit={notify} block>
              <Newsletter
                subdomain={subdomain}
                heading={theme?.footerNewsletterHeading || 'Stay in touch'}
                text={theme?.footerNewsletterText || 'New arrivals and the occasional offer. No spam.'}
                isEditor={isEditor}
                dark={dark}
                border={border}
              />
            </EditorItem>
          )}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: border }}
        >
          <p className="text-xs opacity-50">
            © {new Date().getFullYear()} {store.name}. All rights reserved.
          </p>

          {showShopflowBranding && (
            <a
              href="https://shopflow.app?ref=footer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium opacity-50 hover:opacity-80 transition-opacity"
            >
              Powered by <span className="font-bold">ShopFlow</span>
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
