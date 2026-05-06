'use client'

import { ImageOff } from 'lucide-react'
import { EditorItem } from './EditorHighlight'

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
  bgColor?: string | null
  visible?: boolean
}

interface CustomSectionProps {
  section: CustomSectionData
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

export default function CustomSection({ section, themeStyle, isEditor = false, onEdit }: CustomSectionProps) {
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

  const wrapperStyle: React.CSSProperties = section.bgColor ? { backgroundColor: section.bgColor } : {}

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
