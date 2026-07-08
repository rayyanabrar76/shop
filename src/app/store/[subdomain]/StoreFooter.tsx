'use client'

import { Instagram, Twitter, Facebook } from 'lucide-react'
import { EditorItem } from './EditorHighlight'

interface StoreFooterProps {
  store: {
    name: string
  }
  theme: {
    footerColor?: string | null
    footerText?: string | null
    instagramHandle?: string | null
    twitterHandle?: string | null
    facebookUrl?: string | null
  } | null
  showShopflowBranding?: boolean
  isEditor?: boolean
  onEdit?: (s: string) => void
}

function SocialLink({ isEditor, href, label, children }: {
  isEditor: boolean
  href: string
  label: string
  children: React.ReactNode
}) {
  if (isEditor) {
    return (
      <span className="hover:opacity-50 transition-opacity cursor-default" aria-label={label}>
        {children}
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-50 transition-opacity"
      aria-label={label}
    >
      {children}
    </a>
  )
}

export default function StoreFooter({ store, theme, showShopflowBranding = false, isEditor = false, onEdit }: StoreFooterProps) {
  const notify = onEdit ?? (() => {})

  return (
    <footer
      className="mt-auto px-6 md:px-10 py-12 border-t"
      style={{ backgroundColor: 'var(--store-footer, ' + (theme?.footerColor ?? '#f4f4f5') + ')' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <EditorItem section="footer" field="footer-name" label="Store name" isEditor={isEditor} onEdit={notify} block>
            <p className="font-bold text-lg">{store.name}</p>
          </EditorItem>
          <EditorItem section="footer" field="footer-text" label="Footer text" isEditor={isEditor} onEdit={notify} block>
            <p className="text-sm opacity-50 mt-1">
              {theme?.footerText ?? `© ${new Date().getFullYear()} All rights reserved.`}
            </p>
          </EditorItem>
        </div>

        <div className="flex items-center gap-5">
          {theme?.instagramHandle && (
            <EditorItem section="footer" field="footer-instagram" label="Instagram" isEditor={isEditor} onEdit={notify}>
              <SocialLink isEditor={isEditor} href={`https://instagram.com/${theme.instagramHandle}`} label="Instagram">
                <Instagram className="w-5 h-5" />
              </SocialLink>
            </EditorItem>
          )}
          {theme?.twitterHandle && (
            <EditorItem section="footer" field="footer-twitter" label="Twitter" isEditor={isEditor} onEdit={notify}>
              <SocialLink isEditor={isEditor} href={`https://twitter.com/${theme.twitterHandle}`} label="Twitter">
                <Twitter className="w-5 h-5" />
              </SocialLink>
            </EditorItem>
          )}
          {theme?.facebookUrl && (
            <EditorItem section="footer" field="footer-facebook" label="Facebook" isEditor={isEditor} onEdit={notify}>
              <SocialLink isEditor={isEditor} href={theme.facebookUrl} label="Facebook">
                <Facebook className="w-5 h-5" />
              </SocialLink>
            </EditorItem>
          )}
        </div>
      </div>

      {showShopflowBranding && (
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-current/10 flex justify-center">
          <a
            href="https://shopflow.app?ref=footer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium opacity-50 hover:opacity-80 transition-opacity"
          >
            Powered by <span className="font-bold">ShopFlow</span>
          </a>
        </div>
      )}
    </footer>
  )
}
