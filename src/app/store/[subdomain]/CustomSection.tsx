'use client'

import { ImageOff } from 'lucide-react'
import { readableText } from '@/lib/contrast'
import { EditorItem } from './EditorHighlight'
import { useStoreBase } from '@/components/StoreBaseProvider'

export interface StoreCategory {
  id: string
  name: string
  slug: string
  imageUrl?: string | null
  count?: number
}

export interface CustomSectionData {
  id: string
  name: string
  layout: string
  heading?: string | null
  text?: string | null
  imageUrl?: string | null
  buttonLabel?: string | null
  buttonUrl?: string | null
  buttonVariant?: string | null
  buttonRadius?: string | null
  buttonColor?: string | null
  buttonFont?: string | null
  showButton?: boolean | null
  categoryIds?: string | null
  showCount?: boolean | null
  bgColor?: string | null
  visible?: boolean
}

interface CustomSectionProps {
  section: CustomSectionData
  categories?: StoreCategory[]
  subdomain?: string
  themeStyle: {
    primaryColor: string
    borderRadius: string
    buttonStyle: string
    headingFont: string
  }
  isEditor?: boolean
  onEdit?: (s: string) => void
}

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
}

function MediaDisplay({ url, alt, className, style }: { url?: string | null; alt: string; className: string; style?: React.CSSProperties }) {
  if (!url) {
    return (
      <div className={className + ' flex items-center justify-center text-zinc-300 bg-zinc-100'} style={style}>
        <ImageOff className="w-10 h-10" />
      </div>
    )
  }
  if (isVideoUrl(url)) {
    return <video src={url} className={className} style={style} autoPlay muted loop playsInline />
  }
  return <img src={url} alt={alt} className={className} style={style} />
}

export default function CustomSection({ section, themeStyle, categories = [], subdomain = '', isEditor = false, onEdit }: CustomSectionProps) {
  const storeBase = useStoreBase()
  if (!section.visible) return null

  const { primaryColor, borderRadius, buttonStyle, headingFont } = themeStyle
  const heading = section.heading?.trim()
  const text = section.text?.trim()
  const notify = onEdit ?? (() => {})
  const meta = { sectionId: section.id }

  const headingStyle = { fontFamily: headingFont === 'serif' ? 'serif' : 'inherit' }

  const effectiveVariant = section.buttonVariant ?? buttonStyle
  const effectiveRadius  = section.buttonRadius  ?? '0.5rem'
  const effectiveColor   = section.buttonColor   ?? primaryColor
  const effectiveFont    = section.buttonFont === 'serif' ? 'serif' : section.buttonFont === 'mono' ? 'monospace' : 'inherit'

  const buttonStyleObj: React.CSSProperties = {
    backgroundColor: effectiveVariant === 'solid' ? effectiveColor : 'transparent',
    color: effectiveVariant === 'solid' ? '#fff' : effectiveColor,
    border: effectiveVariant === 'ghost' ? 'none' : `1.5px solid ${effectiveColor}`,
    borderRadius: effectiveRadius,
    fontFamily: effectiveFont,
  }

  // A section can be given any background, so the page's own text colour is no
  // guarantee of contrast — a dark section on a light theme left near-black
  // text on near-black. Set here rather than per element: everything inside
  // inherits, and the opacity-based muted styles come along with it.
  const wrapperStyle: React.CSSProperties = section.bgColor
    ? { backgroundColor: section.bgColor, color: readableText(section.bgColor) }
    : {}

  // ── Shop by Category ──
  // Tiles straight to the category-filtered product list, using the newest
  // product in each category as its image.
  if (section.layout === 'shop-by-category') {
    // Blank categoryIds means "all", which is what a freshly added section does
    // before anyone picks any.
    const picked = (section.categoryIds ?? '').split(',').map(x => x.trim()).filter(Boolean)
    const shown = picked.length ? categories.filter(c => picked.includes(c.id)) : categories
    const viewAllHref = section.buttonUrl || `${storeBase}/products`
    const viewAllLabel = section.buttonLabel || 'View all'

    return (
      <section className="px-4 md:px-8 py-14 max-w-7xl mx-auto w-full" style={wrapperStyle}>
        {/* Heading left, view-all right — the standard collection-row header. */}
        <div className="flex items-end justify-between gap-6 mb-9">
          <div className="min-w-0">
            {heading && (
              <EditorItem section="custom" field="section-heading" meta={meta} label="Heading" isEditor={isEditor} onEdit={notify} block>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight uppercase" style={headingStyle}>
                  {heading}
                </h2>
              </EditorItem>
            )}
            {text && (
              <EditorItem section="custom" field="section-text" meta={meta} label="Text" isEditor={isEditor} onEdit={notify} block>
                <p className="text-sm opacity-60 mt-2 max-w-xl">{text}</p>
              </EditorItem>
            )}
          </div>

          {section.showButton && (
            <EditorItem section="custom" field="section-button" meta={meta} label="View all link" isEditor={isEditor} onEdit={notify}>
              {isEditor ? (
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] underline underline-offset-4 cursor-default">
                  {viewAllLabel}
                </span>
              ) : (
                <a
                  href={viewAllHref}
                  className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] underline underline-offset-4 hover:opacity-60 transition-opacity"
                >
                  {viewAllLabel}
                </a>
              )}
            </EditorItem>
          )}
        </div>

        {shown.length === 0 ? (
          <p className="text-sm opacity-50 py-8">
            No categories yet — add some under Categories and they will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9 sm:gap-x-6 sm:gap-y-10">
            {shown.map(cat => {
              const inner = (
                <>
                  <div
                    className="relative overflow-hidden bg-zinc-50"
                    style={{ borderRadius, border: '1px solid var(--store-card-border, #e7e7e7)', aspectRatio: '1 / 1' }}
                  >
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/cat:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <ImageOff className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="pt-3.5">
                    <p className="text-[13px] font-bold uppercase tracking-[0.08em] leading-snug">{cat.name}</p>
                    {section.showCount && typeof cat.count === 'number' && (
                      <p className="text-[11px] tracking-[0.1em] opacity-50 mt-1">
                        {cat.count} {cat.count === 1 ? 'product' : 'products'}
                      </p>
                    )}
                  </div>
                </>
              )
              // Inert in the editor so a click selects the section.
              return isEditor ? (
                <div key={cat.id} className="group/cat block">{inner}</div>
              ) : (
                <a
                  key={cat.id}
                  href={`${storeBase}/categories/${encodeURIComponent(cat.slug)}`}
                  className="group/cat block"
                >
                  {inner}
                </a>
              )
            })}
          </div>
        )}
      </section>
    )
  }



  const H = ({ children }: { children: React.ReactNode }) => (
    <EditorItem section="custom" field="custom-heading" meta={meta} label="Heading" isEditor={isEditor} onEdit={notify} block>
      <h2 className="text-3xl font-bold tracking-tight" style={headingStyle}>{children}</h2>
    </EditorItem>
  )
  const HLarge = ({ children }: { children: React.ReactNode }) => (
    <EditorItem section="custom" field="custom-heading" meta={meta} label="Heading" isEditor={isEditor} onEdit={notify} block>
      <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={headingStyle}>{children}</h2>
    </EditorItem>
  )
  const T = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <EditorItem section="custom" field="custom-text" meta={meta} label="Text" isEditor={isEditor} onEdit={notify} block>
      <p className={className ?? 'text-base opacity-70 leading-relaxed'}>{children}</p>
    </EditorItem>
  )
  const Btn = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <EditorItem section="custom" field="custom-button" meta={meta} label="Button" isEditor={isEditor} onEdit={notify} block>
      <a href={href} style={buttonStyleObj} className="inline-block px-6 py-2.5 text-sm font-bold mt-2 transition-opacity hover:opacity-90">
        {children}
      </a>
    </EditorItem>
  )

  if (section.layout === 'heading-text') {
    return (
      <section className="px-6 py-12" style={wrapperStyle}>
        <div className="max-w-3xl mx-auto text-center space-y-3">
          {heading && <H>{heading}</H>}
          {text && <T>{text}</T>}
        </div>
      </section>
    )
  }

  if (section.layout === 'heading-only') {
    return (
      <section className="px-6 py-16" style={wrapperStyle}>
        <div className="max-w-4xl mx-auto text-center">
          {heading && <HLarge>{heading}</HLarge>}
        </div>
      </section>
    )
  }

  if (section.layout === 'image-text') {
    return (
      <section className="px-6 py-12" style={wrapperStyle}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="aspect-video bg-zinc-100 overflow-hidden" style={{ borderRadius }}>
            <MediaDisplay url={section.imageUrl} alt={heading ?? ''} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-3">
            {heading && <H>{heading}</H>}
            {text && <T>{text}</T>}
            {section.buttonLabel && section.buttonUrl && <Btn href={section.buttonUrl}>{section.buttonLabel}</Btn>}
          </div>
        </div>
      </section>
    )
  }

  if (section.layout === 'text-image') {
    return (
      <section className="px-6 py-12" style={wrapperStyle}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3 md:order-1 order-2">
            {heading && <H>{heading}</H>}
            {text && <T>{text}</T>}
            {section.buttonLabel && section.buttonUrl && <Btn href={section.buttonUrl}>{section.buttonLabel}</Btn>}
          </div>
          <div className="aspect-video bg-zinc-100 overflow-hidden md:order-2 order-1" style={{ borderRadius }}>
            <MediaDisplay url={section.imageUrl} alt={heading ?? ''} className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    )
  }

  if (section.layout === 'image-banner') {
    return (
      <section className="px-6 py-8" style={wrapperStyle}>
        <div className="relative max-w-6xl mx-auto aspect-3/1 overflow-hidden flex items-center justify-center" style={{ borderRadius }}>
          {section.imageUrl ? (
            <>
              <MediaDisplay url={section.imageUrl} alt={heading ?? ''} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
            </>
          ) : (
            <div className="absolute inset-0 bg-zinc-200" />
          )}
          <div className="relative text-center text-white max-w-2xl px-6 space-y-3">
            {heading && (
              <EditorItem section="custom" field="custom-heading" meta={meta} label="Heading" isEditor={isEditor} onEdit={notify}>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight" style={headingStyle}>{heading}</h2>
              </EditorItem>
            )}
            {text && <T className="text-sm md:text-base opacity-90">{text}</T>}
            {section.buttonLabel && section.buttonUrl && <Btn href={section.buttonUrl}>{section.buttonLabel}</Btn>}
          </div>
        </div>
      </section>
    )
  }

  if (section.layout === 'centered-cta') {
    return (
      <section className="px-6 py-16" style={wrapperStyle}>
        <div className="max-w-2xl mx-auto text-center space-y-4">
          {heading && (
            <EditorItem section="custom" field="custom-heading" meta={meta} label="Heading" isEditor={isEditor} onEdit={notify}>
              <h2 className="text-4xl font-black tracking-tight" style={headingStyle}>{heading}</h2>
            </EditorItem>
          )}
          {text && <T className="text-lg opacity-70 leading-relaxed">{text}</T>}
          {section.buttonLabel && section.buttonUrl && (
            <EditorItem section="custom" field="custom-button" meta={meta} label="Button" isEditor={isEditor} onEdit={notify}>
              <a href={section.buttonUrl} style={buttonStyleObj} className="inline-block px-8 py-3 text-base font-bold mt-3 transition-opacity hover:opacity-90">
                {section.buttonLabel}
              </a>
            </EditorItem>
          )}
        </div>
      </section>
    )
  }

  return null
}
