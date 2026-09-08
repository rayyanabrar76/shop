'use client'

import React from 'react'

export interface SkeletonTheme {
  primaryColor: string
  backgroundColor: string
  textColor: string
  footerColor: string
  borderRadius: string
  bannerText: string
  showBanner: boolean
  logoUrl: string
  logoWidth: number
  footerText: string
  buttonStyle?: string
  navLinks?: { label: string; href: string }[] | null
  navFontSize?: number
  navCase?: string
}

export interface PageSkeletonProps {
  theme: SkeletonTheme
  storeName: string
  pageType: string
  pageContent?: any
  heroSlides?: { heading?: string; subheading?: string; ctaLabel?: string; bgColor?: string | null; imageUrl?: string | null }[]
}

const KF = `@keyframes _skp{0%,100%{opacity:1}50%{opacity:.3}}`

function skColors(dark?: boolean) {
  return {
    bar:    dark ? '#3f3f46' : '#e4e4e7',
    card:   dark ? '#18181b' : '#ffffff',
    border: dark ? '#27272a' : '#f1f1f1',
    border2: dark ? '#3f3f46' : '#e4e4e7',
    nav:    dark ? '#a1a1aa' : '#71717a',
    icon:   dark ? '#71717a' : '#a1a1aa',
  }
}

/** Gray pulsing placeholder bar */
function P({
  w, h, r = 4, d = 0, extra, dark,
}: {
  w: number | string; h: number; r?: number; d?: number; extra?: React.CSSProperties; dark?: boolean
}) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: dark ? '#3f3f46' : '#e4e4e7',
      animation: '_skp 1.2s ease-in-out infinite',
      animationDelay: `${d}s`,
      ...extra,
    }} />
  )
}

/* ── shared sections ── */

function Banner({ theme }: { theme: SkeletonTheme }) {
  if (!theme.showBanner || !theme.bannerText) return null
  return (
    <div style={{
      background: theme.primaryColor, color: '#fff',
      textAlign: 'center', padding: '7px 40px',
      fontSize: 12, fontWeight: 500, flexShrink: 0,
    }}>
      {theme.bannerText}
    </div>
  )
}

function Header({ theme, storeName }: { theme: SkeletonTheme; storeName: string }) {
  const links = (theme.navLinks && theme.navLinks.length > 0)
    ? theme.navLinks
    : [{ label: 'Home' }, { label: 'Products' }, { label: 'About' }]
  const textCase: React.CSSProperties['textTransform'] =
    theme.navCase === 'upper' ? 'uppercase' : theme.navCase === 'lower' ? 'lowercase' : 'none'
  const sk = skColors(false)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px', borderBottom: `1px solid ${sk.border}`,
      background: sk.card, flexShrink: 0,
    }}>
      {/* Logo / name */}
      {theme.logoUrl
        ? <img src={theme.logoUrl} alt="" style={{ width: Math.min(theme.logoWidth || 120, 120), height: 30, objectFit: 'contain' }} />
        : <span style={{ fontWeight: 700, fontSize: 15, color: theme.textColor }}>{storeName}</span>
      }
      {/* Nav */}
      <div style={{ display: 'flex', gap: 20 }}>
        {links.slice(0, 5).map((l, i) => (
          <span key={i} style={{
            fontSize: theme.navFontSize || 14, color: sk.nav,
            fontWeight: 500, textTransform: textCase,
          }}>
            {'label' in l ? l.label : ''}
          </span>
        ))}
      </div>
      {/* Icons */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={sk.icon} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={sk.icon} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={sk.icon} strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      </div>
    </div>
  )
}

function Footer({ theme, storeName }: { theme: SkeletonTheme; storeName: string }) {
  return (
    <div style={{
      background: theme.footerColor, borderTop: `1px solid ${false ? '#27272a' : '#e4e4e7'}`,
      padding: '24px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', flexShrink: 0,
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: theme.textColor }}>{storeName}</div>
        {theme.footerText && <div style={{ fontSize: 11, opacity: 0.45, marginTop: 3, color: theme.textColor }}>{theme.footerText}</div>}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <P w={18} h={18} r={99} d={0} />
        <P w={18} h={18} r={99} d={0.1} />
        <P w={18} h={18} r={99} d={0.2} />
      </div>
    </div>
  )
}

function Btn({ theme, label }: { theme: SkeletonTheme; label: string }) {
  const solid = theme.buttonStyle !== 'outline'
  return (
    <div style={{
      display: 'inline-block', padding: '9px 22px',
      background: solid ? theme.primaryColor : 'transparent',
      color: solid ? '#fff' : theme.primaryColor,
      border: `1.5px solid ${theme.primaryColor}`,
      borderRadius: theme.borderRadius,
      fontWeight: 700, fontSize: 11, cursor: 'default',
    }}>
      {label}
    </div>
  )
}

/* ── page-specific bodies ── */

function HomeBody({ theme, heroSlides }: { theme: SkeletonTheme; heroSlides?: PageSkeletonProps['heroSlides'] }) {
  const slide = heroSlides?.[0]
  const bg = slide?.bgColor || '#f8f7ff'
  return (
    <>
      {/* Hero */}
      <div style={{
        background: slide?.imageUrl ? '#111' : bg,
        padding: '44px 32px', position: 'relative', overflow: 'hidden',
      }}>
        {slide?.imageUrl && (
          <img src={slide.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 26, marginBottom: 8, color: slide?.imageUrl ? '#fff' : theme.textColor, lineHeight: 1.2 }}>
            {slide?.heading || 'Welcome to Our Store'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 20, maxWidth: 300, color: slide?.imageUrl ? '#fff' : theme.textColor }}>
            {slide?.subheading || 'Discover products you will love.'}
          </div>
          <Btn theme={theme} label={slide?.ctaLabel || 'Shop Now'} />
        </div>
        {(heroSlides?.length ?? 0) > 1 && (
          <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
            {heroSlides!.map((_, i) => (
              <div key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 99, background: i === 0 ? theme.primaryColor : '#d1d5db' }} />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: false ? '#27272a' : '#f1f1f1', margin: '0' }} />

      {/* Products */}
      <div style={{ padding: '16px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 4, height: 14, borderRadius: 99, background: theme.primaryColor }} />
          <P w={110} h={9} />
        </div>
        <ProductCards theme={theme} count={4} />
      </div>
    </>
  )
}

function ProductCards({ theme, count = 4 }: { theme: SkeletonTheme; count?: number }) {
  const solid = theme.buttonStyle !== 'outline'
  const sk = skColors(false)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: sk.card, border: `1px solid ${sk.border}`, borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <P w="100%" h={110} r={0} d={i * 0.08} dark={false} />
          <div style={{ padding: '9px 9px 8px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <P w="72%" h={8} d={i * 0.08} dark={false} />
            <P w="44%" h={8} d={i * 0.08} dark={false} />
            <div style={{
              marginTop: 3, padding: '7px 0', textAlign: 'center',
              background: solid ? theme.primaryColor : 'transparent',
              border: `1.5px solid ${theme.primaryColor}`,
              borderRadius: theme.borderRadius,
            }}>
              <P w="55%" h={7} extra={{ margin: '0 auto', background: solid ? 'rgba(255,255,255,0.35)' : sk.bar }} d={i * 0.08} dark={false} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProductsBody({ theme }: { theme: SkeletonTheme }) {
  return (
    <div style={{ padding: '16px 24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 4, height: 14, borderRadius: 99, background: theme.primaryColor }} />
        <P w={110} h={9} />
      </div>
      <ProductCards theme={theme} count={4} />
      <div style={{ marginTop: 10 }}>
        <ProductCards theme={theme} count={4} />
      </div>
    </div>
  )
}

function AboutBody({ theme, content }: { theme: SkeletonTheme; content?: any }) {
  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '36px 24px', width: '100%' }}>
      <div style={{ fontWeight: 900, fontSize: 28, marginBottom: 10, color: theme.textColor }}>
        {content?.heading || <P w="55%" h={28} />}
      </div>
      {content?.intro
        ? <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 22, color: theme.textColor }}>{content.intro}</p>
        : <div style={{ marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 6 }}><P w="92%" h={9} /><P w="70%" h={9} d={0.1} /></div>
      }
      <P w="100%" h={150} r={12} d={0.05} extra={{ marginBottom: 24 }} />
      {(['story', 'mission'] as const).map((key, i) => (
        <div key={key} style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 7, color: theme.textColor }}>
            {key === 'story' ? 'Our Story' : 'Our Mission'}
          </div>
          {content?.[key]
            ? <p style={{ fontSize: 13, opacity: 0.6, color: theme.textColor }}>{content[key]}</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><P w="98%" h={8} d={i * 0.1} /><P w="80%" h={8} d={i * 0.15} /></div>
          }
        </div>
      ))}
    </div>
  )
}

function ContactBody({ theme, content }: { theme: SkeletonTheme; content?: any }) {
  const solid = theme.buttonStyle !== 'outline'
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '36px 24px', width: '100%' }}>
      <div style={{ fontWeight: 900, fontSize: 28, marginBottom: 8, color: theme.textColor }}>
        {content?.heading || 'Contact Us'}
      </div>
      {content?.intro && <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20, color: theme.textColor }}>{content.intro}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['Name', 'Email', 'Message'].map((lbl, i) => (
            <div key={lbl}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.38, marginBottom: 4, color: theme.textColor }}>{lbl}</div>
              <P w="100%" h={i === 2 ? 68 : 32} r={8} d={i * 0.08} />
            </div>
          ))}
          <div style={{ padding: '10px 0', textAlign: 'center', fontWeight: 700, fontSize: 11, background: solid ? theme.primaryColor : 'transparent', color: solid ? '#fff' : theme.primaryColor, border: `1.5px solid ${theme.primaryColor}`, borderRadius: theme.borderRadius }}>
            Send Message
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {content?.address || content?.email || content?.phone
            ? [content.address, content.email, content.phone].filter(Boolean).map((val: string, i: number) => (
                <div key={i}><P w={55} h={7} d={i * 0.1} extra={{ marginBottom: 5 }} /><div style={{ fontSize: 12, opacity: 0.7, color: theme.textColor }}>{val}</div></div>
              ))
            : [0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><P w={55} h={7} d={i * 0.1} /><P w="75%" h={9} d={i * 0.1} /></div>
              ))
          }
        </div>
      </div>
    </div>
  )
}

function FaqBody({ theme, content }: { theme: SkeletonTheme; content?: any }) {
  const items: { q: string }[] = content?.items ?? []
  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '36px 24px', width: '100%' }}>
      <div style={{ fontWeight: 900, fontSize: 28, marginBottom: 20, color: theme.textColor }}>
        {content?.heading || 'FAQ'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(items.length > 0 ? items.slice(0, 6) : Array.from({ length: 5 })).map((item: any, i: number) => (
          <div key={i} style={{ border: '1px solid #e4e4e7', borderRadius: 10, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {item?.q
              ? <span style={{ fontSize: 13, fontWeight: 600, color: theme.textColor }}>{item.q}</span>
              : <P w={`${52 + (i % 3) * 12}%`} h={9} d={i * 0.08} />
            }
            <span style={{ color: '#a1a1aa', fontSize: 9 }}>▼</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AuthBody({ theme, isSignup }: { theme: SkeletonTheme; isSignup?: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: 270, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontWeight: 900, fontSize: 22, color: theme.textColor }}>{isSignup ? 'Create Account' : 'Sign In'}</div>
        <P w="65%" h={9} d={0.1} />
        {isSignup && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.38, marginBottom: 4, color: theme.textColor }}>Name</div>
            <P w="100%" h={34} r={8} d={0.05} />
          </div>
        )}
        {['Email address', 'Password'].map((lbl, i) => (
          <div key={lbl}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.38, marginBottom: 4, color: theme.textColor }}>{lbl}</div>
            <P w="100%" h={34} r={8} d={i * 0.1} />
          </div>
        ))}
        <div style={{ padding: '11px 0', textAlign: 'center', fontWeight: 700, fontSize: 12, background: theme.primaryColor, color: '#fff', borderRadius: theme.borderRadius, marginTop: 2 }}>
          {isSignup ? 'Create Account' : 'Sign In'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><P w="60%" h={8} r={4} d={0.15} /></div>
      </div>
    </div>
  )
}

function AccountBody({ theme }: { theme: SkeletonTheme }) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '36px 24px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <P w={50} h={50} r={99} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}><P w={110} h={13} r={5} /><P w={155} h={9} d={0.1} /></div>
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${false ? '#27272a' : '#f1f1f1'}` }}>
          <P w={80} h={9} d={i * 0.08} dark={false} />
          <P w={130} h={32} r={8} d={i * 0.08} dark={false} />
        </div>
      ))}
    </div>
  )
}

function OrdersBody({ theme }: { theme: SkeletonTheme }) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '36px 24px', width: '100%' }}>
      <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 20, color: theme.textColor }}>Order History</div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ border: '1px solid #e4e4e7', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #f1f1f1', gap: 12 }}>
            <P w={90} h={9} d={i * 0.1} />
            <P w={70} h={9} d={i * 0.1} />
            <P w={58} h={20} r={6} d={i * 0.1} />
            <P w={50} h={9} d={i * 0.1} />
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '10px 18px', alignItems: 'center' }}>
            <P w={38} h={38} r={6} d={i * 0.1} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}><P w="55%" h={8} d={i * 0.1} /><P w="35%" h={8} d={i * 0.1} /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

function CheckoutBody({ theme }: { theme: SkeletonTheme }) {
  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '36px 24px', width: '100%' }}>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 20, color: theme.textColor }}>Checkout</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <P w="50%" h={11} r={5} />
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <P w={46} h={46} r={7} d={i * 0.1} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}><P w="68%" h={8} d={i * 0.1} /><P w="38%" h={8} d={i * 0.1} /></div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <P w="50%" h={11} r={5} />
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}><P w="42%" h={9} d={i * 0.1} /><P w="24%" h={9} d={i * 0.1} /></div>
          ))}
          <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <P w="28%" h={13} r={4} /><P w="22%" h={13} r={4} d={0.1} />
          </div>
          <div style={{ padding: '11px 0', textAlign: 'center', fontWeight: 700, fontSize: 12, background: theme.primaryColor, color: '#fff', borderRadius: theme.borderRadius }}>
            Place Order
          </div>
        </div>
      </div>
    </div>
  )
}

function SuccessBody({ theme }: { theme: SkeletonTheme }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px', gap: 14 }}>
      <div style={{ width: 62, height: 62, borderRadius: 99, background: theme.primaryColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.primaryColor} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <div style={{ fontWeight: 900, fontSize: 20, color: theme.textColor }}>Order Confirmed!</div>
      <P w={220} h={9} d={0.1} />
      <P w={180} h={9} d={0.2} />
      <div style={{ marginTop: 14, width: 240, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}><P w="42%" h={9} d={i * 0.1} /><P w="28%" h={9} d={i * 0.1} /></div>
        ))}
      </div>
    </div>
  )
}

function BlogBody({ theme, content }: { theme: SkeletonTheme; content?: any }) {
  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '36px 24px', width: '100%' }}>
      <div style={{ fontWeight: 900, fontSize: 28, marginBottom: 6, color: theme.textColor }}>{content?.heading || 'Blog'}</div>
      {content?.intro && <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20, color: theme.textColor }}>{content.intro}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
            <P w="100%" h={110} r={0} d={i * 0.1} />
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <P w="65%" h={13} r={4} d={i * 0.1} />
              <P w="88%" h={8} d={i * 0.15} />
              <P w="55%" h={8} d={i * 0.1} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GenericBody({ theme, content }: { theme: SkeletonTheme; content?: any }) {
  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '36px 24px', width: '100%' }}>
      <div style={{ fontWeight: 900, fontSize: 28, marginBottom: 20, color: theme.textColor }}>
        {content?.heading || <P w="48%" h={28} />}
      </div>
      {content?.content
        ? <p style={{ fontSize: 13, lineHeight: 1.8, opacity: 0.65, color: theme.textColor, whiteSpace: 'pre-wrap' }}>{content.content}</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[100, 93, 87, 95, 0, 100, 88, 96, 75, 0, 100, 82].map((w, i) =>
              w === 0
                ? <div key={i} style={{ height: 10 }} />
                : <P key={i} w={`${w}%`} h={9} d={(i % 3) * 0.08} />
            )}
          </div>
        )
      }
    </div>
  )
}

/* ── main export ── */

const CONTENT_PAGES = ['home', 'products', 'about', 'contact', 'faq', 'login', 'signup', 'account', 'orders', 'checkout', 'success', 'blog']

export default function PageSkeleton({ theme, storeName, pageType, pageContent, heroSlides }: PageSkeletonProps) {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden flex flex-col" style={{ background: theme.backgroundColor }}>
      <style>{KF}</style>
      <Banner theme={theme} />
      <Header theme={theme} storeName={storeName} />

      <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {pageType === 'home'     && <HomeBody     theme={theme} heroSlides={heroSlides} />}
        {pageType === 'products' && <ProductsBody theme={theme} />}
        {pageType === 'about'    && <AboutBody    theme={theme} content={pageContent} />}
        {pageType === 'contact'  && <ContactBody  theme={theme} content={pageContent} />}
        {pageType === 'faq'      && <FaqBody      theme={theme} content={pageContent} />}
        {pageType === 'login'    && <AuthBody     theme={theme} />}
        {pageType === 'signup'   && <AuthBody     theme={theme} isSignup />}
        {pageType === 'account'  && <AccountBody  theme={theme} />}
        {pageType === 'orders'   && <OrdersBody   theme={theme} />}
        {pageType === 'checkout' && <CheckoutBody theme={theme} />}
        {pageType === 'success'  && <SuccessBody  theme={theme} />}
        {pageType === 'blog'     && <BlogBody     theme={theme} content={pageContent} />}
        {!CONTENT_PAGES.includes(pageType) && <GenericBody theme={theme} content={pageContent} />}
      </div>

      <Footer theme={theme} storeName={storeName} />
    </div>
  )
}
