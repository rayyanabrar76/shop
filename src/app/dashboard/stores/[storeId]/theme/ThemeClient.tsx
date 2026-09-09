'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Paintbrush, ExternalLink, ChevronRight, Loader2,
  Megaphone, PanelTop, Image as ImageIcon, LayoutGrid, Rows3, PanelBottom,
  Palette, Search, Code2,
} from 'lucide-react'

/**
 * The width the storefront is rendered at before being scaled into the card.
 *
 * Always wider than the card, so the preview is always zoomed out: a whole
 * desktop page in frame — header, menu, logo, hero and the start of what is
 * under it — rather than a browser-sized window showing the top corner of it.
 * It is the difference between a picture of the shop and a crop of it.
 */
const FRAME_W = 1600

/** What the page can say about each part of the storefront, read from the
 *  theme and the catalogue rather than described. */
export interface StorefrontFacts {
  primaryColor: string
  palette: { page: string; footer: string; text: string; primary: string; accent: string }
  headingFont: string
  font: string
  showBanner: boolean
  bannerText: string
  hasLogo: boolean
  /** null when the shop is on the default menu. */
  navLinkCount: number | null
  heroSlideCount: number
  layout: string
  productCount: number
  sectionCount: number
  newsletter: boolean
  pageCount: number
  seoTitleSet: boolean
  faviconSet: boolean
  customCode: boolean
}

export interface ThemeClientProps {
  storeId: string
  storeName: string
  previewUrl: string
  liveUrl: string
  displayUrl: string
  facts: StorefrontFacts
}

const FONT_LABELS: Record<string, string> = { sans: 'Sans', serif: 'Serif', mono: 'Mono' }
const LAYOUT_LABELS: Record<string, string> = { grid: 'Grid', carousel: 'Carousel', editorial: 'Editorial', list: 'Grid' }

function fontLabel(v: string) {
  return FONT_LABELS[v] ?? v.replace(/['"]/g, '').split(',')[0]
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}

/**
 * The customisation home: what the shop looks like right now, and the ways in.
 *
 * Most of the page is a live preview, the real storefront in an iframe. Under
 * it is an index of the storefront: every part of the page in the order a
 * shopper meets it, each row saying what is actually there — how many slides,
 * which layout, whether the banner is showing — with the editor one click
 * away. It is a table of contents for the shop rather than a menu of
 * settings, which is what makes it worth reading before opening the editor.
 */
export default function ThemeClient({
  storeId, storeName, previewUrl, liveUrl, displayUrl, facts,
}: ThemeClientProps) {
  const [loading, setLoading] = useState(true)
  const frameRef = useRef<HTMLIFrameElement>(null)

  /**
   * Pin the preview to the top of the page.
   *
   * scrolling="no" stops a reader scrolling it; it does not stop the document
   * inside restoring a scroll position of its own, which had the preview
   * opening part-way down the shop's header. Same-origin, so it can simply be
   * told where to sit.
   */
  function handleFrameLoad() {
    setLoading(false)
    try {
      frameRef.current?.contentWindow?.scrollTo(0, 0)
    } catch {
      // A cross-origin frame would refuse; nothing here is worth failing over.
    }
  }

  const boxRef = useRef<HTMLDivElement>(null)
  const [boxW, setBoxW] = useState(0)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => setBoxW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Zoomed out at every size: the frame is wider than the card and shrinks to
  // fit it, so the card shows more of the page than a browser that size would.
  const frameW = FRAME_W
  const scale = boxW ? boxW / FRAME_W : 0.6

  const editorHref = `/dashboard/stores/${storeId}/theme/editor`
  const at = (section: string) => `${editorHref}?section=${section}`

  const f = facts
  const palette = [
    { label: 'Page', value: f.palette.page, grow: 5 },
    { label: 'Footer', value: f.palette.footer, grow: 3 },
    { label: 'Text', value: f.palette.text, grow: 2 },
    { label: 'Primary', value: f.palette.primary, grow: 2 },
    { label: 'Accent', value: f.palette.accent, grow: 1 },
  ]

  /** The rows, in the order a shopper meets them. */
  const page: Row[] = [
    {
      href: at('banner'), icon: Megaphone, label: 'Announcement bar',
      fact: f.showBanner ? (f.bannerText.trim() || 'Showing') : 'Hidden',
      tone: f.showBanner ? 'on' : 'off',
    },
    {
      href: at('header'), icon: PanelTop, label: 'Header',
      fact: [f.hasLogo ? 'Logo' : 'Name as logo', f.navLinkCount === null ? 'default menu' : plural(f.navLinkCount, 'menu link')].join(' · '),
    },
    {
      href: at('hero'), icon: ImageIcon, label: 'Hero',
      fact: plural(f.heroSlideCount, 'slide'),
    },
    {
      href: at('products'), icon: LayoutGrid, label: 'Product grid',
      fact: `${LAYOUT_LABELS[f.layout] ?? f.layout} · ${plural(f.productCount, 'product')}`,
    },
    {
      href: at('custom'), icon: Rows3, label: 'Sections',
      fact: f.sectionCount > 0 ? plural(f.sectionCount, 'custom section') : 'None yet',
      tone: f.sectionCount > 0 ? undefined : 'off',
    },
    {
      href: at('footer'), icon: PanelBottom, label: 'Footer',
      fact: [f.newsletter ? 'Newsletter on' : 'Newsletter off', f.pageCount > 0 ? plural(f.pageCount, 'page link') : null].filter(Boolean).join(' · '),
    },
  ]

  const theme: Row[] = [
    {
      href: at('list'), icon: Palette, label: 'Colours & type',
      fact: `${fontLabel(f.headingFont)} / ${fontLabel(f.font)}`,
      swatch: true,
    },
    {
      href: at('seo'), icon: Search, label: 'SEO & favicon',
      fact: [f.seoTitleSet ? 'Title set' : 'No page title', f.faviconSet ? 'favicon set' : 'no favicon'].join(' · '),
      tone: f.seoTitleSet && f.faviconSet ? undefined : 'warn',
    },
    {
      href: at('code'), icon: Code2, label: 'Custom code',
      fact: f.customCode ? 'Added' : 'None',
      tone: f.customCode ? undefined : 'off',
    },
  ]

  return (
    <div className="max-w-6xl px-3.5 md:px-6 pb-10 space-y-6">
      {/* ── The shop, as it stands ────────────────────────────────────────
          The picture runs edge to edge, so the shop's own header is the first
          thing in frame. Its details ride on a frosted panel floating at the
          bottom, over the page rather than in a strip beside it — the card is
          the storefront, not a form with a thumbnail in it.

          The whole thing sits on a glow mixed from the shop's primary colour,
          so the admin page is lit by the shop rather than the other way
          round. */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-8 -top-10 -bottom-6 -z-10 blur-3xl opacity-70 dark:opacity-50"
          style={{
            background: `radial-gradient(55% 60% at 50% 20%, color-mix(in srgb, ${f.primaryColor} 38%, transparent), transparent 70%)`,
          }}
        />

        <div
          className="group relative aspect-4/3 md:aspect-16/10 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-950 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.45)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,0.32,0.16,1)] hover:scale-[1.004] hover:shadow-[0_34px_90px_-30px_rgba(0,0,0,0.55)]"
          // The iframe is scaled, and a transformed child can slip past a
          // rounded overflow clip; clip-path is not subject to that.
          style={{ clipPath: 'inset(0 round 1rem)' }}
        >
          <Link href={editorHref} aria-label="Open the visual editor" className="absolute inset-0 block">
            <div ref={boxRef} className="absolute inset-0">
              <iframe
                ref={frameRef}
                src={previewUrl}
                title={`${storeName} preview`}
                onLoad={handleFrameLoad}
                tabIndex={-1}
                scrolling="no"
                className="origin-top-left border-0 pointer-events-none bg-white"
                style={{
                  width: frameW,
                  // Taller than the card, so the fold is not the whole story.
                  // The overflow is clipped by the frame.
                  height: 1100,
                  transform: `scale(${scale})`,
                }}
              />
            </div>

            {loading && (
              <span className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              </span>
            )}
          </Link>

          {/* A hairline drawn over the picture rather than around the card, so
              the edge stays crisp without the ring cutting into the corners. */}
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 dark:ring-white/10" />

          {/* The picture closing off at the foot.

              A progressive blur rather than a hard edge: the layer is blurred
              throughout and masked so it ramps in on the way down, so the page
              drifts out of focus over the last third of the card instead of
              being cut across by a band. It reaches well above the panel on
              purpose: a blur confined to the strip behind the panel is a band
              with soft edges, not a page trailing off. A little shade with it,
              so the panel reads on a pale image. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] backdrop-blur-2xl"
            style={{
              // The ramp starts sooner than the layer does, so the top of it
              // is barely there and the page thickens into the blur rather
              // than meeting an edge. Two stops rather than one: a single
              // gradient reaches full strength at a point you can see, and
              // the eye finds it.
              maskImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.35) 46%, black 82%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.35) 46%, black 82%)',
            }}
          />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/40 via-black/12 to-transparent" />

          {/* The panel. Inset and floating, not a full-width strip: it reads
              as something resting on the shop rather than a chrome bar bolted
              to it. Its own element, not inside the link, so the buttons are
              real controls and not anchors nested in an anchor. */}
          <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-3 sm:bottom-3 flex items-center gap-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl px-3 sm:px-3.5 py-2.5 ring-1 ring-black/5 dark:ring-white/10 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping [animation-duration:2.4s]" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold tracking-[-0.005em] text-zinc-900 dark:text-zinc-50">
                {displayUrl}
              </span>
              <span className="hidden sm:block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {storeName}
                {f.sectionCount > 0 && ` · ${plural(f.sectionCount, 'section')}`}
                {f.pageCount > 0 && ` · ${plural(f.pageCount, 'page')}`}
              </span>
            </span>

            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              title="Open the live store"
              aria-label="Open the live store"
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <span className="hidden sm:inline">View live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href={editorHref}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-white px-3 text-[11.5px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customise</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── The index ─────────────────────────────────────────────────────
          Every part of the storefront, top to bottom, each saying what is
          there. Read from the theme and the catalogue, so a row cannot
          disagree with the preview above it. */}
      <section className="rounded-2xl border border-(--admin-border) bg-(--admin-card) shadow-sm overflow-hidden">
        <Group title="Page" hint="in the order a shopper sees it">
          {page.map(r => <IndexRow key={r.label} {...r} />)}
        </Group>
        <Group title="Theme" hint="applies everywhere" first={false}>
          {theme.map(r => <IndexRow key={r.label} {...r} palette={r.swatch ? palette : undefined} />)}
        </Group>
      </section>
    </div>
  )
}

interface Row {
  href: string
  icon: typeof PanelTop
  label: string
  fact: string
  /** on = a green mark, off = greyed fact, warn = amber fact. */
  tone?: 'on' | 'off' | 'warn'
  swatch?: boolean
}

function Group({ title, hint, first = true, children }: { title: string; hint: string; first?: boolean; children: React.ReactNode }) {
  return (
    <div className={first ? '' : 'border-t border-(--admin-edge)'}>
      <div className="flex items-baseline gap-2 px-4 sm:px-5 pt-3.5 pb-1.5">
        <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</h2>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</span>
      </div>
      <ul className="pb-1.5">{children}</ul>
    </div>
  )
}

function IndexRow({
  href, icon: Icon, label, fact, tone, palette,
}: Row & { palette?: { label: string; value: string; grow: number }[] }) {
  const factCls =
    tone === 'off' ? 'text-zinc-400 dark:text-zinc-500'
    : tone === 'warn' ? 'text-amber-600 dark:text-amber-400'
    : 'text-zinc-500 dark:text-zinc-400'
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 sm:gap-4 mx-1.5 px-2.5 sm:px-3.5 h-13 sm:h-12 rounded-xl hover:bg-(--admin-bg-muted) transition-colors"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--admin-bg-muted) text-zinc-500 group-hover:bg-(--admin-card) group-hover:text-zinc-800 dark:group-hover:text-zinc-100 transition-colors">
          <Icon className="w-4 h-4" />
        </span>

        {/* Label and fact share a line on a desk and stack on a phone, where
            the fact would otherwise be truncated to nothing. */}
        <span className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
          <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 truncate sm:shrink-0">{label}</span>
          <span className={`min-w-0 flex items-center gap-2 text-[11.5px] sm:text-[12px] truncate ${factCls}`}>
            {palette && (
              <span className="flex h-3.5 w-16 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10 dark:ring-white/15">
                {palette.map(c => (
                  <span key={c.label} title={`${c.label} · ${c.value}`} style={{ background: c.value, flexGrow: c.grow }} />
                ))}
              </span>
            )}
            {tone === 'on' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />}
            <span className="truncate">{fact}</span>
          </span>
        </span>

        <ChevronRight className="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600 -translate-x-1 opacity-60 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-zinc-500 transition-[opacity,transform,color]" />
      </Link>
    </li>
  )
}
