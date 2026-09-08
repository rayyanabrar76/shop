'use client'

import { useState } from 'react'
import { ImagePlus, X, Video } from 'lucide-react'
import MediaLibraryModal from './MediaLibraryModal'

interface MediaPickerProps {
  storeId: string
  value: string
  onChange: (url: string) => void
  accept?: 'image' | 'video' | 'all'
  placeholder?: string
  /** For callers that render their own, larger preview. */
  hidePreview?: boolean
  /** Given, the preview becomes clickable and opens the image full size. */
  onOpen?: (url: string) => void
}

export default function MediaPicker({
  storeId,
  value,
  onChange,
  accept = 'image',
  placeholder,
  hidePreview = false,
  onOpen,
}: MediaPickerProps) {
  const [showLibrary, setShowLibrary] = useState(false)

  const isVideo = value && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(value)

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShowLibrary(true)}
        className="px-3 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
      >
        <ImagePlus className="w-3.5 h-3.5" />
        {value ? 'Change image' : 'Choose from Library'}
      </button>

      {!value && placeholder && (
        <p className="text-xs text-zinc-400">{placeholder}</p>
      )}

      {/* Preview */}
      {value && !hidePreview && (
        <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-(--admin-border)">
          {isVideo ? (
            <video src={value} className="w-full max-h-32 object-cover" controls={false} muted />
          ) : (
            <img
              src={value}
              alt="Preview"
              onClick={onOpen ? () => onOpen(value) : undefined}
              title={onOpen ? 'Open full size' : undefined}
              className={`w-full max-h-32 object-cover ${onOpen ? 'cursor-zoom-in' : ''}`}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white hover:bg-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
          {isVideo && (
            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold flex items-center gap-1">
              <Video className="w-2.5 h-2.5" /> VIDEO
            </div>
          )}
        </div>
      )}

      {showLibrary && (
        <MediaLibraryModal
          storeId={storeId}
          accept={accept}
          onClose={() => setShowLibrary(false)}
          onSelect={(url) => {
            onChange(url)
            setShowLibrary(false)
          }}
        />
      )}
    </div>
  )
}