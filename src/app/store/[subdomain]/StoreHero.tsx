'use client'

import { useState, useEffect, useCallback } from 'react'
import { EditorItem } from './EditorHighlight'
import { sanitizeRichText } from '@/lib/sanitize'
import { useStoreBase, resolveStoreHref } from '@/components/StoreBaseProvider'
import { resolveHeroButton } from '@/lib/hero-button'

export interface HeroSlide {
  id: string
  heading: string
  subheading: string
  ctaLabel: string
  ctaUrl: string
  imageUrl?: string | null
  bgColor?: string | null
}

/**
 * The band's vertical rhythm, in one place.
 *
 * HEADER_OVERLAY is what a transparent header takes off the top. Without it
 * the text is centred in the whole band, which is not the part you can see:
 * the menu sits over the first seventy-odd pixels, so the heading ends up
 * pressed against it with a wide empty gap underneath.
 *
 * CONTENT_MIN is a floor, not a height. Slides do not have the same number of
 * lines, and a centred block of different heights starts at a different place
 * on every slide, so the carousel appears to shuffle its own text as it turns.
 * With a floor under it the heading begins at the same point every time and
 * only a genuinely long slide pushes past it.
 */
const HEADER_OVERLAY = 76
const CONTENT_MIN = 320

/*
 * How tall the band stands, as a share of the window.
 *
 * A share rather than a number of pixels, so it means the same thing on a
 * phone held upright and on a monitor: 100 is the screen, whatever the screen
 * is. It used to be a flat 460px, which is roughly 60% of a phone, so that is
 * the default and nothing moves for a shop that never touches it.
 *
 * dvh, not vh: on a phone the address bar slides away as you scroll, and vh
 * measures the window as if it never had one, so a "full screen" hero sat
 * about 60px taller than the screen and its button was under the fold on
 * arrival.
 */
/**
 * Where the slide's words sit in the band.
 *
 * Nine positions from two axes, because those are the two questions: which
 * edge the text is anchored to, and how far down it sits. Written out as whole
 * class strings rather than built from the value, since Tailwind reads source
 * text and would never see a class assembled at runtime.
 *
 * The column keeps its own alignment as well as its placement: text pushed to
 * the right of the band and still ranged left reads as a mistake.
 */
const POSITIONS: Record<string, { band: string; column: string }> = {
  'left-top':      { band: 'items-start',  column: 'mr-auto text-left items-start' },
  'center-top':    { band: 'items-start',  column: 'mx-auto text-center items-center' },
  'right-top':     { band: 'items-start',  column: 'ml-auto text-right items-end' },
  'left-middle':   { band: 'items-center', column: 'mr-auto text-left items-start' },
  'center-middle': { band: 'items-center', column: 'mx-auto text-center items-center' },
  'right-middle':  { band: 'items-center', column: 'ml-auto text-right items-end' },
  'left-bottom':   { band: 'items-end',    column: 'mr-auto text-left items-start' },
  'center-bottom': { band: 'items-end',    column: 'mx-auto text-center items-center' },
  'right-bottom':  { band: 'items-end',    column: 'ml-auto text-right items-end' },
}

const HERO_MIN_VH = 40
const HERO_MAX_VH = 100
function heroHeightCss(pct: number | null | undefined): string {
  const n = typeof pct === 'number' && pct > 0 ? pct : 60
  return `${Math.min(HERO_MAX_VH, Math.max(HERO_MIN_VH, n))}dvh`
}

interface StoreHeroProps {
  theme: {
    primaryColor?: string | null
    accentColor?: string | null
    borderRadius?: string | null
    buttonStyle?: string | null
    headingFont?: string | null
    /** The header floats over this section rather than sitting above it. */
    headerTransparent?: boolean | null
    /** Percentage of the window the band fills. */
    heroHeight?: number | null
    /** Where the words sit in the band, as "x-y". */
    heroPosition?: string | null
    /** How the call to action is drawn. See src/lib/hero-button.ts. */
    heroButton?: unknown
  } | null
  storeName: string
  storeId: string
  slides?: HeroSlide[]
  activeSlide?: number | null
  isEditor?: boolean
  onEdit?: (s: string) => void
}

const DEFAULT_SLIDES: HeroSlide[] = [
  { id: 'slide-1', heading: 'Welcome to Our Store', subheading: 'Discover products you will love, curated just for you.', ctaLabel: 'Shop Now', ctaUrl: '#products', bgColor: '#f8f7ff' },
  { id: 'slide-2', heading: 'New Arrivals', subheading: 'Fresh drops every week.', ctaLabel: "See What's New", ctaUrl: '#products', bgColor: '#fff7ed' },
]

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
}

export default function StoreHero({ theme, slides: propSlides, activeSlide, isEditor = false, onEdit }: StoreHeroProps) {
  const storeBase = useStoreBase()
  const slides = propSlides && propSlides.length > 0 ? propSlides : DEFAULT_SLIDES
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (typeof activeSlide === 'number' && activeSlide >= 0 && activeSlide < slides.length) {
      setCurrent(activeSlide)
    }
  }, [activeSlide, slides.length])

  useEffect(() => {
    if (current >= slides.length) setCurrent(0)
  }, [slides.length, current])

  const isPaused = typeof activeSlide === 'number'

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return
    const timer = setInterval(() => goTo((current + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [current, slides.length, isPaused])

  const goTo = useCallback((idx: number) => {
    setTransitioning(true)
    setTimeout(() => {
      setCurrent(idx)
      setTransitioning(false)
    }, 220)
  }, [])

  const slide = slides[current]
  if (!slide) return null

  const primary = theme?.primaryColor ?? '#0a0a0a'
  const buttonStyle = theme?.buttonStyle ?? 'solid'
  const radius = theme?.borderRadius ?? '0px'
  const notify = onEdit ?? (() => {})
  const hasMedia = !!slide.imageUrl
  // This section only ever renders on the home page, which is the only place a
  // transparent header floats, so the setting alone is the answer here.
  const overlaysHeader = theme?.headerTransparent === true
  const bandHeight = heroHeightCss(theme?.heroHeight)
  const place = POSITIONS[theme?.heroPosition || 'left-middle'] ?? POSITIONS['left-middle']

  /*
   * The call to action.
   *
   * Blank means "work it out", everywhere. Style falls back to the theme's own
   * button style; each colour falls back to what the button used to compute
   * for itself, which over a photograph is white on the brand colour, because
   * a dark fill on a dark image is a button nobody finds.
   *
   * The row is separate from the button so alignment can be its own choice:
   * the text can range left while the button sits centred, which is the
   * arrangement this was asked for and the one the content position alone
   * could not make.
   */
  const btn = resolveHeroButton(theme?.heroButton)
  const btnStyle = btn.style || buttonStyle
  const btnBg = btn.bgColor || (hasMedia ? '#ffffff' : primary)
  const btnFg = btn.textColor || (hasMedia ? primary : '#ffffff')
  const btnLine = btn.borderColor || (hasMedia ? 'rgba(255,255,255,0.85)' : primary)
  const btnRadius = btn.radius || radius
  const btnRow =
    btn.align === 'left' ? 'justify-start'
    : btn.align === 'center' ? 'justify-center'
    : btn.align === 'right' ? 'justify-end'
    : ''
  const btnWidth = `${btn.widthMobile === 'full' ? 'w-full justify-center' : 'w-auto'} ${
    btn.widthDesktop === 'full' ? 'sm:w-full sm:justify-center' : 'sm:w-auto'
  }`
  const isVideo = isVideoUrl(slide.imageUrl)

  return (
    <section
      className="relative w-full overflow-hidden transition-colors duration-500"
      style={{
        backgroundColor: slide.bgColor ?? '#f4f4f8',
        minHeight: bandHeight,
      }}
    >
      {/* Full-bleed background media */}
      {hasMedia && (
        <div className="absolute inset-0 w-full h-full">
          {isVideo ? (
            <video
              key={slide.id}
              src={slide.imageUrl!}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.22s' }}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={slide.imageUrl!}
              alt={slide.heading}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.22s' }}
            />
          )}
          {/* Dark overlay so text is readable on any image */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Content */}
      <div
        className={`relative z-10 max-w-7xl mx-auto flex ${place.band}`}
        style={{
          minHeight: bandHeight,
          // Centred in what is visible, not in the box.
          paddingTop: overlaysHeader ? HEADER_OVERLAY : 0,
        }}
      >
        <div
          className={`w-full max-w-2xl px-8 md:px-14 py-8 flex flex-col gap-4 ${place.column}`}
          style={{
            minHeight: CONTENT_MIN,
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 0.22s',
          }}
        >
          <EditorItem section="hero" field="hero-heading" meta={{ slideIndex: current }} label="Heading" isEditor={isEditor} onEdit={notify}>
            {/* Sanitised HTML like the subheading. The base classes below are
                the default when the merchant has not picked a level; a chosen
                heading tag overrides them through the [&_hN] rules, which have
                to restate the sizes because preflight strips heading styles. */}
            <div
              className={`text-3xl md:text-5xl font-black leading-tight ${'[&_h1]:text-3xl [&_h1]:md:text-5xl [&_h1]:font-black [&_h2]:text-2xl [&_h2]:md:text-4xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:md:text-3xl [&_h3]:font-bold [&_h4]:text-lg [&_h4]:md:text-2xl [&_h4]:font-semibold [&_h5]:text-base [&_h5]:md:text-xl [&_h5]:font-semibold [&_h6]:text-sm [&_h6]:md:text-base [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-widest'}`}
              style={{
                fontFamily: theme?.headingFont === 'serif' ? 'serif' : 'inherit',
                color: hasMedia ? '#ffffff' : (theme?.accentColor ?? '#09090b'),
                textShadow: hasMedia ? '0 2px 12px rgba(0,0,0,0.4)' : 'none',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(slide.heading) }}
            />
          </EditorItem>
          <EditorItem section="hero" field="hero-subheading" meta={{ slideIndex: current }} label="Subheading" isEditor={isEditor} onEdit={notify}>
            {/* Rendered as HTML so the toolbar's bold, links and lists show
                as formatting. Everything passes through sanitizeRichText: the
                toolbar can only make safe markup, but a paste from Word or a
                browser extension can put anything into the field. */}
            <div
              className="text-sm md:text-lg max-w-md leading-relaxed [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:text-base [&_h5]:font-semibold [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-widest"
              style={{
                color: hasMedia ? 'rgba(255,255,255,0.9)' : 'inherit',
                opacity: hasMedia ? 1 : 0.6,
                textShadow: hasMedia ? '0 1px 8px rgba(0,0,0,0.4)' : 'none',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(slide.subheading) }}
            />
          </EditorItem>
          {btn.show && (
          <div className={`flex items-center gap-3 mt-2 w-full ${btnRow}`}>
            <EditorItem section="hero" field="hero-cta" meta={{ slideIndex: current }} label="CTA Button" isEditor={isEditor} onEdit={notify} block>
              {/* A solid button was also being given the white 2px border meant
                  for outline buttons, so it read as a black chip ringed in
                  white. Each style now gets only what it should:
                    solid:   filled, no border. Over a photo it flips to white
                              on the brand colour, which stays legible on any
                              image instead of a dark fill on a dark donut.
                    outline: a hairline, never 2px, which reads as chunky.
                    ghost:   type only, with a rule that draws in on hover. */}
              <a
                href={resolveStoreHref(slide.ctaUrl, storeBase)}
                {...(btn.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`group/cta relative inline-flex items-center px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-300 ${btnWidth} ${
                  btnStyle === 'ghost' || btnStyle === 'text' ? '' : 'hover:-translate-y-0.5'
                }`}
                style={{
                  backgroundColor: btnStyle === 'solid' ? btnBg : 'transparent',
                  color: btnStyle === 'solid' ? btnFg : btnBg,
                  border: btnStyle === 'outline' ? `1px solid ${btnLine}` : 'none',
                  borderRadius: btnStyle === 'text' ? 0 : btnRadius,
                  // Lifts the button off busy photography without an outline.
                  boxShadow:
                    btnStyle === 'solid' && hasMedia ? '0 6px 24px rgba(0,0,0,0.28)' : 'none',
                }}
              >
                {slide.ctaLabel}
                {(btnStyle === 'ghost' || btnStyle === 'text') && (
                  <span
                    className="pointer-events-none absolute bottom-2 left-7 right-7 h-px origin-left scale-x-0 transition-transform duration-300 group-hover/cta:scale-x-100"
                    style={{ backgroundColor: btnBg }}
                  />
                )}
              </a>
            </EditorItem>
          </div>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                backgroundColor: i === current ? (hasMedia ? '#fff' : primary) : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}

    </section>
  )
}