'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Monitor, Tablet, Smartphone, Pencil, ExternalLink } from 'lucide-react'

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

const DEVICES = [
  { id: 'desktop' as const, icon: Monitor,    label: 'Desktop', width: null },
  { id: 'tablet'  as const, icon: Tablet,     label: 'Tablet',  width: 768  },
  { id: 'mobile'  as const, icon: Smartphone, label: 'Mobile',  width: 390  },
]

export default function OwnerPreviewBar({ storeId }: { storeId: string }) {
  const [device, setDevice]           = useState<DeviceMode>('desktop')
  const [visible, setVisible]         = useState(false)
  const [previewUrl, setPreviewUrl]   = useState('')
  const [customerUrl, setCustomerUrl] = useState('')
  // Track which device iframes have been mounted so we keep them in DOM (no re-load on switch)
  const [mounted, setMounted] = useState<Set<DeviceMode>>(new Set())

  useEffect(() => {
    const params    = new URLSearchParams(window.location.search)
    const isIframe  = window.self !== window.top
    const isCustomer = params.has('customerView')

    // Only show bar on real page load by the owner — not inside an iframe or customer view tab
    if (!isIframe && !isCustomer) {
      setVisible(true)
    }

    // iframe preview URL (hides editor highlights)
    const pUrl = new URL(window.location.href)
    pUrl.searchParams.delete('customerView')
    pUrl.searchParams.set('preview', '1')
    setPreviewUrl(pUrl.toString())

    // customer view URL (hides the bar itself)
    const cUrl = new URL(window.location.href)
    cUrl.searchParams.delete('preview')
    cUrl.searchParams.set('customerView', '1')
    setCustomerUrl(cUrl.toString())
  }, [])

  if (!visible) return null

  return (
    <>
      {/* Keep each device iframe in DOM once loaded — avoids re-fetching on switch */}
      {DEVICES.filter(d => d.width && mounted.has(d.id)).map(d => (
        <div
          key={d.id}
          className="fixed inset-0 bg-zinc-800 flex flex-col items-center justify-start pt-6 pb-20"
          style={{ zIndex: 9998, display: device === d.id ? 'flex' : 'none' }}
        >
          <div
            className="bg-white shadow-2xl overflow-hidden"
            style={{
              width: d.width!,
              height: 'calc(100vh - 96px)',
              borderRadius: '16px',
              border: '8px solid #27272a',
            }}
          >
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title={`${d.label} preview`}
            />
          </div>
        </div>
      ))}

      {/* Floating bar */}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-zinc-900/95 backdrop-blur rounded-2xl px-3 py-2 shadow-2xl border border-zinc-700"
        style={{ zIndex: 9999 }}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mr-1 select-none">
          Preview
        </span>

        {DEVICES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              setDevice(id)
              if (id !== 'desktop') setMounted(prev => new Set([...prev, id]))
            }}
            title={label}
            className="p-1.5 rounded-xl transition-colors"
            style={{
              backgroundColor: device === id ? '#fff'    : 'transparent',
              color:           device === id ? '#18181b' : '#71717a',
            }}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <Link
          href={`/dashboard/stores/${storeId}/theme/editor`}
          className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors px-1"
        >
          <Pencil className="w-3 h-3" />
          Edit Theme
        </Link>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <a
          href={customerUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="See store as a customer — copy URL into incognito for a fully clean view"
          className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors px-1"
        >
          <ExternalLink className="w-3 h-3" />
          Customer View
        </a>
      </div>
    </>
  )
}
