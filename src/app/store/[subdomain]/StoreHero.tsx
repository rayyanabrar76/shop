'use client'

import { useState, useEffect, useCallback } from 'react'
import { EditorItem } from './EditorHighlight'
import { sanitizeRichText } from '@/lib/sanitize'

export interface HeroSlide {
  id: string
  heading: string
  subheading: string
  ctaLabel: string
  ctaUrl: string
  imageUrl?: string | null
  bgColor?: string | null
}

interface StoreHeroProps {
  theme: {
    primaryColor?: string | null
    accentColor?: string | null
    borderRadius?: string | null
    buttonStyle?: string | null
    headingFont?: string | null
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
  const isVideo = isVideoUrl(slide.imageUrl)

  return (
    <section
      className="relative w-full overflow-hidden transition-colors duration-500"
      style={{
        backgroundColor: slide.bgColor ?? '#f4f4f8',
        minHeight: 420,
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
        className="relative z-10 max-w-7xl mx-auto flex items-center"
        style={{ minHeight: 420 }}
      >
        <div
          className="flex-1 px-8 md:px-14 py-16 flex flex-col gap-4 max-w-2xl"
          style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.22s' }}
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
          <div className="flex items-center gap-3 mt-2">
            <EditorItem section="hero" field="hero-cta" meta={{ slideIndex: current }} label="CTA Button" isEditor={isEditor} onEdit={notify}>
              {/* A solid button was also being given the white 2px border meant
                  for outline buttons, so it read as a black chip ringed in
                  white. Each style now gets only what it should:
                    solid   — filled, no border. Over a photo it flips to white
                              on the brand colour, which stays legible on any
                              image instead of a dark fill on a dark donut.
                    outline — a hairline, never 2px, which reads as chunky.
                    ghost   — type only, with a rule that draws in on hover. */}
              <a
                href={slide.ctaUrl}
                className={`group/cta relative inline-flex items-center px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-300 ${
                  buttonStyle === 'ghost' ? '' : 'hover:-translate-y-0.5'
                }`}
                style={{
                  backgroundColor:
                    buttonStyle !== 'solid' ? 'transparent' : hasMedia ? '#ffffff' : primary,
                  color:
                    buttonStyle === 'solid'
                      ? hasMedia ? primary : '#ffffff'
                      : hasMedia ? '#ffffff' : primary,
                  border:
                    buttonStyle === 'outline'
                      ? `1px solid ${hasMedia ? 'rgba(255,255,255,0.85)' : primary}`
                      : 'none',
                  borderRadius: radius,
                  // Lifts the button off busy photography without an outline.
                  boxShadow:
                    buttonStyle === 'solid' && hasMedia ? '0 6px 24px rgba(0,0,0,0.28)' : 'none',
                }}
              >
                {slide.ctaLabel}
                {buttonStyle === 'ghost' && (
                  <span
                    className="pointer-events-none absolute bottom-2 left-7 right-7 h-px origin-left scale-x-0 transition-transform duration-300 group-hover/cta:scale-x-100"
                    style={{ backgroundColor: hasMedia ? '#ffffff' : primary }}
                  />
                )}
              </a>
            </EditorItem>
          </div>
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

      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo((current - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors text-base font-bold shadow-lg"
            style={{ borderRadius: radius }}
          >
            &#8249;
          </button>
          <button
            onClick={() => goTo((current + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors text-base font-bold shadow-lg"
            style={{ borderRadius: radius }}
          >
            &#8250;
          </button>
        </>
      )}
    </section>
  )
}