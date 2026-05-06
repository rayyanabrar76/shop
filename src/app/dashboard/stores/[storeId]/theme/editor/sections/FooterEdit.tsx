'use client'

import SectionHeader from './SectionHeader'
import { ThemeState, labelCls, inputCls } from '../types'
import { Instagram, Twitter, Facebook } from 'lucide-react'

interface FooterEditProps {
  theme: ThemeState
  updateTheme: (patch: Partial<ThemeState>) => void
  onBack: () => void
}

export default function FooterEdit({ theme, updateTheme, onBack }: FooterEditProps) {
  return (
    <div>
      <SectionHeader title="Footer" description="Footer text and social links" onBack={onBack} />
      <div className="p-4 space-y-5">

        <div data-field="footer-text">
          <label className={labelCls}>Footer Text</label>
          <input
            className={inputCls}
            value={theme.footerText}
            onChange={e => updateTheme({ footerText: e.target.value })}
            placeholder="© 2025 All rights reserved."
          />
        </div>

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
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">Enter only your handle — no @ or full URL needed.</p>
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
      <span className="px-2 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-[10px] border-r border-zinc-200 dark:border-zinc-700 shrink-0 font-mono">{prefix}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 py-2 text-sm outline-none bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 min-w-0"
      />
    </div>
  )
}
