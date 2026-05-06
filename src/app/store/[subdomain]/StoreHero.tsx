'use client'

import { useState, useEffect, useCallback } from 'react'
import { EditorItem } from './EditorHighlight'

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

  const primary = theme?.primaryColor ?? '#6c47ff'
  const radius = theme?.borderRadius ?? '0.75rem'
  const buttonStyle = theme?.buttonStyle ?? 'solid'
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
            <h2
              className="text-3xl md:text-5xl font-black leading-tight"
              style={{
                fontFamily: theme?.headingFont === 'serif' ? 'serif' : 'inherit',
                color: hasMedia ? '#ffffff' : (theme?.accentColor ?? '#09090b'),
                textShadow: hasMedia ? '0 2px 12px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              {slide.heading}
            </h2>
          </EditorItem>
          <EditorItem section="hero" field="hero-subheading" meta={{ slideIndex: current }} label="Subheading" isEditor={isEditor} onEdit={notify}>
            <p
              className="text-sm md:text-lg max-w-md leading-relaxed"
              style={{
                color: hasMedia ? 'rgba(255,255,255,0.9)' : 'inherit',
                opacity: hasMedia ? 1 : 0.6,
                textShadow: hasMedia ? '0 1px 8px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              {slide.subheading}
            </p>
          </EditorItem>
          <div className="flex items-center gap-3 mt-2">
            <EditorItem section="hero" field="hero-cta" meta={{ slideIndex: current }} label="CTA Button" isEditor={isEditor} onEdit={notify}>
              <a
                href={slide.ctaUrl}
                className="inline-flex items-center px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80"
                style={{
                  backgroundColor: buttonStyle === 'solid' ? primary : 'transparent',
                  color: buttonStyle === 'solid' ? '#fff' : (hasMedia ? '#fff' : primary),
                  border: buttonStyle === 'ghost' ? 'none' : `2px solid ${hasMedia ? '#fff' : primary}`,
                  borderRadius: '0.5rem',
                }}
              >
                {slide.ctaLabel}
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
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors text-base font-bold shadow-lg"
          >
            &#8249;
          </button>
          <button
            onClick={() => goTo((current + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors text-base font-bold shadow-lg"
          >
            &#8250;
          </button>
        </>
      )}
    </section>
  )
}