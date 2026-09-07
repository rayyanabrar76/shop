'use client'

import { useState, useEffect } from 'react'
import StoreBanner from '../StoreBanner'
import StoreHeader from '../StoreHeader'
import StoreFooter from '../StoreFooter'
import CartSidebar from '../cart-sidebar'
import DarkModeSync from '../DarkModeSync'
import CustomSectionComponent, { type CustomSectionData } from '../CustomSection'
import SectionDivider from '../SectionDivider'
import { EditorItem, EditorSection } from '../EditorHighlight'

interface ThemeState {
  primaryColor: string
  backgroundColor: string
  footerColor: string
  accentColor: string
  textColor: string
  borderRadius: string
  buttonStyle: string
  font: string
  headingFont: string
  bannerText: string
  showBanner: boolean
  logoUrl: string
  logoWidth: number
  logoHeight?: number
  headerLayout?: string
  menuPosition?: string
  headerWidth?: string
  headerHeight?: string
  headerSticky?: boolean
  headerBorderWidth?: number
  headerBgColor?: string
  headerTextColor?: string
  utilityStyle?: string
  headerTransparent?: boolean
  headerInverseLogoUrl?: string
  headerTransparentText?: string
  footerText: string
  footerLogoUrl?: string
  footerLogoWidth?: number
  footerLogoHeight?: number
  instagramHandle: string
  twitterHandle: string
  facebookUrl: string
  layout: string
  cardShadow: string
  dividerStyle: string
  navLinks?: { label: string; href: string }[] | null
  navFontSize?: number
  navCase?: string
  navDividers?: boolean
  darkMode?: boolean
  showDarkToggle?: boolean
}

interface StorePageClientProps {
  store: { id: string; name: string; subdomain: string }
  pageName: string
  pageType: string
  initialContent: unknown
  initialCustomSections: CustomSectionData[]
  theme: ThemeState
  subdomain: string
}

export default function StorePageClient({
  store,
  pageName,
  pageType,
  initialContent,
  initialCustomSections,
  theme: initialTheme,
  subdomain,
}: StorePageClientProps) {
  const [content, setContent] = useState<any>(initialContent)
  const [customSections, setCustomSections] = useState<CustomSectionData[]>(initialCustomSections)
  const [isEditor, setIsEditor] = useState(false)
  const [theme, setTheme] = useState<ThemeState>(initialTheme)

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).has('preview')
    const inEditor = window.self !== window.top && !isPreview
    setIsEditor(inEditor)
    if (inEditor) window.parent.postMessage({ type: 'page:ready' }, '*')
  }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'theme:update' && event.data.theme) {
        setTheme(prev => ({ ...prev, ...event.data.theme }))
      }
      if (event.data?.type === 'page-content:update') {
        setContent(event.data.content)
      }
      if (event.data?.type === 'custom-sections:update') {
        setCustomSections(event.data.sections)
      }
      if (event.data?.type === 'section:drag') {
        // Clear any previous outline first: the cursor moves between sections
        // during one drag, and two outlined sections at once would say the
        // drop could land in either place.
        document
          .querySelectorAll('[data-dragging]')
          .forEach(n => n.removeAttribute('data-dragging'))

        const key = event.data.section
        if (key) {
          const el = document.getElementById(`section-${key}`)
          if (el) {
            // An attribute, not a class. The live reorder posts a theme update
            // on the same gesture, React re-renders these sections, and
            // re-rendering rewrites className — so a class added here was being
            // wiped a frame later. React leaves attributes it does not manage
            // alone.
            el.setAttribute('data-dragging', '')
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
      if (event.data?.type === 'section:highlight' && event.data.section) {
        const el = document.getElementById(`section-${event.data.section}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          el.classList.remove('preview-section-pulse')
          void el.offsetWidth
          el.classList.add('preview-section-pulse')
          setTimeout(() => el.classList.remove('preview-section-pulse'), 1800)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  function notifyParent(section: string) {
    window.parent.postMessage({ type: 'section:edit', section }, '*')
  }

  const themeStyle = {
    primaryColor: theme.primaryColor,
    borderRadius: theme.borderRadius,
    buttonStyle: theme.buttonStyle,
    headingFont: theme.headingFont,
    cardShadow: theme.cardShadow,
  }

  const headingStyle: React.CSSProperties = {
    fontFamily: theme.headingFont === 'serif' ? 'serif' : theme.headingFont === 'mono' ? 'monospace' : 'inherit',
  }

  function renderContent() {
    switch (pageType) {
      case 'faq': {
        const items: { id: string; q: string; a: string }[] = content?.items ?? []
        return (
          <div className="max-w-3xl mx-auto w-full px-6 py-16">
            <EditorItem section="header" field="page-heading" label="Page heading" isEditor={isEditor} onEdit={notifyParent}>
              <h1 className="text-4xl font-black tracking-tight mb-10" style={headingStyle}>
                {content?.heading ?? pageName}
              </h1>
            </EditorItem>
            <div className="space-y-3">
              {items.map(item => (
                <details key={item.id} className="rounded-xl border border-zinc-200 overflow-hidden group">
                  <EditorItem section="items" field="faq-question" label="FAQ item" isEditor={isEditor} onEdit={notifyParent}>
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-base select-none list-none">
                      {item.q}
                      <span className="ml-4 text-zinc-400 shrink-0 group-open:rotate-180 transition-transform">&#9660;</span>
                    </summary>
                  </EditorItem>
                  <div className="px-5 pb-4 text-sm leading-relaxed opacity-70">{item.a}</div>
                </details>
              ))}
              {items.length === 0 && <p className="opacity-50 text-sm">No FAQ items yet.</p>}
            </div>
          </div>
        )
      }

      case 'about': {
        return (
          <div className="max-w-3xl mx-auto w-full px-6 py-16 space-y-10">
            <div>
              <EditorItem section="header" field="page-heading" label="Page heading" isEditor={isEditor} onEdit={notifyParent}>
                <h1 className="text-4xl font-black tracking-tight mb-4" style={headingStyle}>{content?.heading ?? pageName}</h1>
              </EditorItem>
              {content?.intro && (
                <EditorItem section="header" field="page-intro" label="Intro text" isEditor={isEditor} onEdit={notifyParent}>
                  <p className="text-base leading-relaxed opacity-70">{content.intro}</p>
                </EditorItem>
              )}
            </div>
            {content?.imageUrl && <img src={content.imageUrl} alt="About us" className="w-full rounded-2xl object-cover max-h-80" />}
            {content?.story && (
              <div>
                <h2 className="text-2xl font-bold mb-3" style={headingStyle}>Our Story</h2>
                <EditorItem section="story" field="page-story" label="Story text" isEditor={isEditor} onEdit={notifyParent}>
                  <p className="text-base leading-relaxed opacity-70">{content.story}</p>
                </EditorItem>
              </div>
            )}
            {content?.mission && (
              <div>
                <h2 className="text-2xl font-bold mb-3" style={headingStyle}>Our Mission</h2>
                <EditorItem section="story" field="page-mission" label="Mission text" isEditor={isEditor} onEdit={notifyParent}>
                  <p className="text-base leading-relaxed opacity-70">{content.mission}</p>
                </EditorItem>
              </div>
            )}
          </div>
        )
      }

      case 'contact': {
        return (
          <div className="max-w-4xl mx-auto w-full px-6 py-16">
            <EditorItem section="header" field="page-heading" label="Page heading" isEditor={isEditor} onEdit={notifyParent}>
              <h1 className="text-4xl font-black tracking-tight mb-4" style={headingStyle}>{content?.heading ?? pageName}</h1>
            </EditorItem>
            {content?.intro && (
              <EditorItem section="header" field="page-intro" label="Intro text" isEditor={isEditor} onEdit={notifyParent}>
                <p className="text-base leading-relaxed opacity-70 mb-10">{content.intro}</p>
              </EditorItem>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1 opacity-50">Name</label>
                  <input disabled={isEditor} type="text" className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1 opacity-50">Email</label>
                  <input disabled={isEditor} type="email" className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors" placeholder="you@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1 opacity-50">Message</label>
                  <textarea disabled={isEditor} className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors resize-none min-h-32" placeholder="Your message..." />
                </div>
                <button
                  type="submit"
                  disabled={isEditor}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-70 disabled:cursor-default"
                  style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
                >
                  Send Message
                </button>
              </form>
              <div className="space-y-5 text-sm">
                {content?.address && (
                  <EditorItem section="details" field="page-address" label="Address" isEditor={isEditor} onEdit={notifyParent}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Address</p>
                      <p className="leading-relaxed opacity-80">{content.address}</p>
                    </div>
                  </EditorItem>
                )}
                {content?.email && (
                  <EditorItem section="details" field="page-email" label="Email" isEditor={isEditor} onEdit={notifyParent}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Email</p>
                      {isEditor
                        ? <span className="opacity-80" style={{ color: theme.primaryColor }}>{content.email}</span>
                        : <a href={`mailto:${content.email}`} className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: theme.primaryColor }}>{content.email}</a>
                      }
                    </div>
                  </EditorItem>
                )}
                {content?.phone && (
                  <EditorItem section="details" field="page-phone" label="Phone" isEditor={isEditor} onEdit={notifyParent}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Phone</p>
                      <p className="opacity-80">{content.phone}</p>
                    </div>
                  </EditorItem>
                )}
              </div>
            </div>
          </div>
        )
      }

      case 'shipping':
      case 'privacy':
      case 'terms': {
        return (
          <div className="max-w-3xl mx-auto w-full px-6 py-16">
            <EditorItem section="header" field="page-heading" label="Page heading" isEditor={isEditor} onEdit={notifyParent}>
              <h1 className="text-4xl font-black tracking-tight mb-8" style={headingStyle}>{content?.heading ?? pageName}</h1>
            </EditorItem>
            <EditorItem section="content" field="page-content" label="Policy content" isEditor={isEditor} onEdit={notifyParent}>
              <p className="text-base leading-relaxed opacity-70" style={{ whiteSpace: 'pre-wrap' }}>{content?.content ?? ''}</p>
            </EditorItem>
          </div>
        )
      }

      case 'blog': {
        return (
          <div className="max-w-3xl mx-auto w-full px-6 py-16">
            <EditorItem section="header" field="page-heading" label="Page heading" isEditor={isEditor} onEdit={notifyParent}>
              <h1 className="text-4xl font-black tracking-tight mb-4" style={headingStyle}>{content?.heading ?? pageName}</h1>
            </EditorItem>
            {content?.intro && (
              <EditorItem section="header" field="page-intro" label="Intro text" isEditor={isEditor} onEdit={notifyParent}>
                <p className="text-base leading-relaxed opacity-70 mb-10">{content.intro}</p>
              </EditorItem>
            )}
            <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
              <p className="text-sm opacity-40 font-medium">No posts yet. Check back soon.</p>
            </div>
          </div>
        )
      }

      default: {
        return (
          <div className="max-w-3xl mx-auto w-full px-6 py-16">
            <EditorItem section="header" field="page-heading" label="Page heading" isEditor={isEditor} onEdit={notifyParent}>
              <h1 className="text-4xl font-black tracking-tight mb-6" style={headingStyle}>{content?.heading ?? pageName}</h1>
            </EditorItem>
            {content?.content && (
              <EditorItem section="content" field="page-content" label="Content" isEditor={isEditor} onEdit={notifyParent}>
                <p className="text-base leading-relaxed opacity-70">{content.content}</p>
              </EditorItem>
            )}
          </div>
        )
      }
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--store-bg)',
        color: 'var(--store-text)',
        fontFamily: theme.font === 'serif' ? 'serif' : theme.font === 'mono' ? 'monospace' : 'inherit',
      }}
    >
      <DarkModeSync />

      {isEditor && (
        <style>{`
          @keyframes preview-section-pulse {
            0%   { box-shadow: 0 0 0 0px rgba(59,130,246,0); }
            25%  { box-shadow: 0 0 0 4px rgba(59,130,246,0.6); }
            55%  { box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
            75%  { box-shadow: 0 0 0 4px rgba(59,130,246,0.6); }
            100% { box-shadow: 0 0 0 0px rgba(59,130,246,0); }
          }
          [data-dragging] {
            outline: 2px solid rgb(59, 130, 246);
            outline-offset: -2px;
            border-radius: 2px;
          }
          .preview-section-pulse { animation: preview-section-pulse 1.6s ease-in-out; }
        `}</style>
      )}

      <EditorSection id="section-banner" label="Announcement Banner" section="banner" isEditor={isEditor} onEdit={notifyParent}>
        <StoreBanner theme={theme} isEditor={isEditor} onEdit={notifyParent} />
      </EditorSection>

      <EditorSection id="section-header" label="Header" section="header" isEditor={isEditor} onEdit={notifyParent}>
        <StoreHeader store={store} theme={theme} subdomain={subdomain} isEditor={isEditor} onEdit={notifyParent} />
      </EditorSection>

      <EditorSection id="section-content" label="Page Content" section="content" isEditor={isEditor} onEdit={notifyParent}>
        <main className="flex-1">
          {renderContent()}
          {customSections.filter(s => s.visible).map(section => (
            <EditorSection key={section.id} id={`section-custom-${section.id}`} label="Custom Section" section="custom" isEditor={isEditor} onEdit={notifyParent}>
              <div>
                <SectionDivider style={theme.dividerStyle} primaryColor={theme.primaryColor} />
                <CustomSectionComponent section={section} themeStyle={themeStyle} isEditor={isEditor} onEdit={notifyParent} />
              </div>
            </EditorSection>
          ))}
        </main>
      </EditorSection>

      <EditorSection id="section-footer" label="Footer" section="footer" isEditor={isEditor} onEdit={notifyParent}>
        <StoreFooter store={store} theme={theme} subdomain={subdomain} isEditor={isEditor} onEdit={notifyParent} />
      </EditorSection>

      <CartSidebar
        themeStyle={{ primaryColor: theme.primaryColor, borderRadius: theme.borderRadius, buttonStyle: theme.buttonStyle }}
        subdomain={subdomain}
      />
    </div>
  )
}
