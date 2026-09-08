'use client'

import Link from 'next/link'

import { useState, useEffect } from 'react'
import SectionHeader from './SectionHeader'
import AiFieldLabel from '@/components/ai/AiFieldLabel'
import { ThemeState, labelCls, inputCls } from '../types'
import { Instagram, Twitter, Facebook, Plus } from 'lucide-react'
import MediaPicker from '@/components/MediaPicker'

interface FooterEditProps {
  storeId: string
  storeName: string
  onPreviewChange: (name: string) => void
  onSaveSuccess: (name: string) => void
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
  /** The store's pages, so the panel can say which policies are missing. */
  pages?: { id: string; name: string; slug: string }[]
  /** Opens the page picker, so a missing policy can be made from here. */
  onAddPage?: () => void
}

export default function FooterEdit({ storeId, storeName, onPreviewChange, onSaveSuccess, theme, updateTheme, onBack, pages = [], onAddPage }: FooterEditProps) {
  const [nameInput, setNameInput] = useState('')
  const [savedName, setSavedName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  // Fetch the real current name from the DB on every open
  useEffect(() => {
    fetch(`/api/stores/${storeId}/settings`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.name) {
          setNameInput(data.name)
          setSavedName(data.name)
          onPreviewChange(data.name)
          onSaveSuccess(data.name)
        }
      })
      .catch(() => {
        // fallback to prop
        setNameInput(storeName)
        setSavedName(storeName)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveStoreName() {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === savedName) return
    setNameSaving(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (res.ok) {
        setSavedName(trimmed)
        onSaveSuccess(trimmed)
      }
    } finally {
      setNameSaving(false)
    }
  }

  return (
    <div>
      <SectionHeader title="Footer" description="Footer text and social links" onBack={onBack} />
      <div className="p-4 space-y-5">

        <div data-field="footer-name">
          <label className={labelCls}>Store Name</label>
          <input
            className={inputCls}
            value={nameInput}
            onChange={e => { setNameInput(e.target.value); onPreviewChange(e.target.value) }}
            onBlur={saveStoreName}
            onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
            disabled={nameSaving}
            placeholder="My Store"
          />
        </div>

        {/* Same theme field the global Theme panel exposes, surfaced here too,
            because this is where people look for it. */}
        <div data-field="footer-bg">
          <label className={labelCls}>Background Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.footerColor || '#ffffff'}
              onChange={e => updateTheme({ footerColor: e.target.value })}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 cursor-pointer shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Footer Background</p>
              <p className="text-[10px] font-mono text-zinc-500">{theme.footerColor || '#ffffff'}</p>
            </div>
            <input
              type="text"
              value={theme.footerColor || ''}
              onChange={e => updateTheme({ footerColor: e.target.value })}
              placeholder="#ffffff"
              className="w-20 text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {[
              { label: 'White', value: '#ffffff' },
              { label: 'Off-white', value: '#fafafa' },
              { label: 'Grey', value: '#f4f4f5' },
              { label: 'Black', value: '#0a0a0a' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateTheme({ footerColor: opt.value })}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg border text-[9px] font-bold transition-all ${
                  (theme.footerColor || '').toLowerCase() === opt.value
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                }`}
              >
                <span className="w-full h-3 rounded border border-black/10" style={{ backgroundColor: opt.value }} />
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5">Dark mode uses its own footer colour and ignores this.</p>
        </div>

        {/* Blank reuses the header logo, so a merchant who sets one logo gets
            it in both places without touching this. */}
        <div data-field="footer-logo">
          <label className={labelCls}>Footer Logo</label>
          <MediaPicker
            storeId={storeId}
            value={theme.footerLogoUrl ?? ''}
            onChange={url => updateTheme({ footerLogoUrl: url })}
            accept="image"
          />
          <p className="text-[10px] text-zinc-400 mt-1">
            {theme.footerLogoUrl
              ? 'Overrides the header logo in the footer.'
              : theme.logoUrl
              ? 'Using your header logo. Upload here only to show a different one.'
              : 'No logo set, the footer shows your store name as text.'}
          </p>
        </div>

        {(theme.footerLogoUrl || theme.logoUrl) && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>Footer Logo Width</label>
                <span className="text-[10px] font-mono text-zinc-400">{theme.footerLogoWidth ?? 130}px</span>
              </div>
              <input
                type="range"
                min={60} max={320} step={10}
                value={theme.footerLogoWidth ?? 130}
                onChange={e => updateTheme({ footerLogoWidth: parseInt(e.target.value) })}
                className="w-full accent-zinc-900 h-1.5 rounded-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>Footer Logo Height</label>
                <span className="text-[10px] font-mono text-zinc-400">{theme.footerLogoHeight ?? 56}px</span>
              </div>
              <input
                type="range"
                min={24} max={140} step={4}
                value={theme.footerLogoHeight ?? 56}
                onChange={e => updateTheme({ footerLogoHeight: parseInt(e.target.value) })}
                className="w-full accent-zinc-900 h-1.5 rounded-full cursor-pointer"
              />
            </div>
          </>
        )}

        <div data-field="footer-text" className="group/ai">
          <AiFieldLabel
            label="Footer Text"
            storeId={storeId}
            kind="paragraph"
            current={theme.footerText}
            hint="the short blurb about the shop in the footer"
            onWrite={text => updateTheme({ footerText: text })}
            labelClassName={labelCls + ' mb-0'}
          />
          <input
            className={inputCls}
            value={theme.footerText}
            onChange={e => updateTheme({ footerText: e.target.value })}
            placeholder="© 2025 All rights reserved."
          />
        </div>

        {/* Link columns */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Link columns</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Shop links and your own pages, policies, about, contact
            </p>
          </div>
          <button
            onClick={() => updateTheme({ footerShowLinks: !theme.footerShowLinks })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${theme.footerShowLinks ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${theme.footerShowLinks ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>

        {theme.footerShowLinks && (
          <div className="-mt-1 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Pages in the footer
            </p>

            {pages.length === 0 ? (
              <p className="text-[11px] text-zinc-500">
                No pages yet, the Information column is empty until you make one.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pages.map(p => (
                  <span key={p.id} className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                    {p.name}
                  </span>
                ))}
              </div>
            )}

            {/* Policies are not pages any more. They are written in Settings,
                where the checkout and this footer both read them from. */}
            <p className="text-[10px] text-zinc-500 mt-2">
              Refund, privacy, terms and shipping policies are written in{' '}
              <Link
                href={`/dashboard/stores/${storeId}/settings?section=policies`}
                className="font-semibold underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Settings → Policies
              </Link>
              {' '}and appear here once written.
            </p>

            {onAddPage && (
              <button
                onClick={onAddPage}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add a page
              </button>
            )}
          </div>
        )}

        {/* Newsletter */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Newsletter signup</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Collects emails in Customers &rarr; Subscribers
            </p>
          </div>
          <button
            onClick={() => updateTheme({ footerNewsletter: !theme.footerNewsletter })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${theme.footerNewsletter ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${theme.footerNewsletter ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>

        {theme.footerNewsletter && (
          <>
            <div className="group/ai">
              <AiFieldLabel
                label="Newsletter heading"
                storeId={storeId}
                kind="heading"
                current={theme.footerNewsletterHeading}
                hint="above the email signup box in the footer"
                onWrite={text => updateTheme({ footerNewsletterHeading: text })}
                labelClassName={labelCls + ' mb-0'}
              />
              <input
                className={inputCls}
                value={theme.footerNewsletterHeading}
                onChange={e => updateTheme({ footerNewsletterHeading: e.target.value })}
                placeholder="Stay in touch"
              />
            </div>

            <div className="group/ai">
              <AiFieldLabel
                label="Newsletter text"
                storeId={storeId}
                kind="subheading"
                current={theme.footerNewsletterText}
                hint="the line under the newsletter heading, saying what people will get"
                onWrite={text => updateTheme({ footerNewsletterText: text })}
                labelClassName={labelCls + ' mb-0'}
              />
              <input
                className={inputCls}
                value={theme.footerNewsletterText}
                onChange={e => updateTheme({ footerNewsletterText: e.target.value })}
                placeholder="New arrivals and the occasional offer. No spam."
              />
            </div>
          </>
        )}

        <div>
          <label className={labelCls}>Social Links</label>
          <div className="space-y-2">
            <SocialInput
              icon={<Instagram className="w-4 h-4 text-pink-600" />}
              prefix="instagram.com/"
              value={theme.instagramHandle}
              onChange={v => updateTheme({ instagramHandle: v.replace(/^@/, '') })}
              placeholder="yourhandle"
            />
            <SocialInput
              icon={<Twitter className="w-4 h-4 text-sky-500" />}
              prefix="twitter.com/"
              value={theme.twitterHandle}
              onChange={v => updateTheme({ twitterHandle: v.replace(/^@/, '') })}
              placeholder="yourhandle"
            />
            <SocialInput
              icon={<Facebook className="w-4 h-4 text-blue-700" />}
              prefix="facebook.com/"
              value={theme.facebookUrl}
              onChange={v => updateTheme({ facebookUrl: v })}
              placeholder="yourpage"
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">Enter only your handle, no @ or full URL needed.</p>
        </div>
      </div>
    </div>
  )
}

function SocialInput({
  icon, prefix, value, onChange, placeholder,
}: {
  icon: React.ReactNode
  prefix: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-all bg-white dark:bg-zinc-900">
      <div className="px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 shrink-0">{icon}</div>
      <span className="px-2 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-[10px] border-r border-zinc-200 dark:border-zinc-700 shrink-0 font-mono">{prefix}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 py-2 text-sm outline-none bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 min-w-0"
      />
    </div>
  )
}
