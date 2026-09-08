'use client'

import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react'
import { thumbUrl, videoPosterUrl } from '@/lib/media-url'
import { slugifyFileName } from '@/lib/upload-filename'
import { createPortal } from 'react-dom'
import { X, Upload, Image as ImageIcon, Video, Trash2, Check, Loader2, FileImage } from 'lucide-react'

export interface MediaAsset {
  id: string
  url: string
  fileId: string
  filename: string
  type: string
  size?: number | null
  width?: number | null
  height?: number | null
  createdAt: string
}

interface MediaLibraryModalProps {
  storeId: string
  accept: 'image' | 'video' | 'all'
  onClose: () => void
  onSelect: (url: string, type: 'image' | 'video') => void
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY

export default function MediaLibraryModal({ storeId, accept, onClose, onSelect }: MediaLibraryModalProps) {
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // The modal is portalled to <body>, which cannot happen on the server.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => { fetchMedia() }, [])

  async function fetchMedia() {
    setLoading(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/media`)
      if (res.ok) setMedia(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file: File) {
    setUploadError(null)
    setUploadProgress(0)
    setUploading(true)

    try {
      const isVideo = file.type.startsWith('video')
      const isImage = file.type.startsWith('image')
      if (accept === 'image' && !isImage) throw new Error('Only images are allowed here')
      if (accept === 'video' && !isVideo) throw new Error('Only videos are allowed here')
      if (!isImage && !isVideo) throw new Error('Only images and videos are supported')

      const authRes = await fetch('/api/imagekit-auth')
      if (!authRes.ok) throw new Error('Failed to get upload auth')
      const auth = await authRes.json()

      const formData = new FormData()
      formData.append('file', file)
      // The picked name goes into the public URL, so it is slugified here
      // rather than shipped as "ChatGPT Image Sep 6, 2026, 12_45_59 PM.png".
      formData.append('fileName', slugifyFileName(file.name, file.type.split('/')[1]))
      formData.append('publicKey', PUBLIC_KEY!)
      formData.append('signature', auth.signature)
      formData.append('expire', String(auth.expire))
      formData.append('token', auth.token)
      formData.append('folder', '/shopflow')

      const uploadResult = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload')

        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        })

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })

      const saveRes = await fetch(`/api/stores/${storeId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url:      uploadResult.url,
          fileId:   uploadResult.fileId,
          filename: uploadResult.name,
          type:     isVideo ? 'video' : 'image',
          size:     uploadResult.size,
          width:    uploadResult.width,
          height:   uploadResult.height,
        }),
      })

      if (!saveRes.ok) throw new Error('Failed to save media record')
      const saved = await saveRes.json()

      setMedia(prev => [saved, ...prev])
      setSelectedId(saved.id)
      setTab('library')
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this file permanently? It will be removed from your library.')) return
    await fetch(`/api/stores/${storeId}/media/${id}`, { method: 'DELETE' })
    setMedia(prev => prev.filter(m => m.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function handleConfirm() {
    const item = media.find(m => m.id === selectedId)
    if (item) onSelect(item.url, item.type as 'image' | 'video')
  }

  const filteredMedia = media.filter(m => {
    if (accept === 'image' && m.type !== 'image') return false
    if (accept === 'video' && m.type !== 'video') return false
    if (filter !== 'all' && m.type !== filter) return false
    return true
  })

  const acceptAttr =
    accept === 'image' ? 'image/*' :
    accept === 'video' ? 'video/*' :
    'image/*,video/*'

  if (!mounted) return null

  /**
   * Portalled to <body> rather than rendered in place.
   *
   * Every caller of this lives somewhere inside the page, and the visual
   * editor's section panels sit inside a sidebar carrying `translate-x-0` for
   * its drawer animation. A transform — even a zero one — makes that element
   * the containing block for any `position: fixed` descendant, so this
   * "full screen" overlay was being laid out inside a 288px column: the
   * library opened as a cramped strip in the sidebar instead of over the page.
   *
   * Escaping to <body> puts it back on the viewport, and fixes it for every
   * other caller at the same time rather than one panel at a time.
   */
  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm dialog-dim">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl h-[88dvh] sm:h-[80dvh] overflow-hidden shadow-2xl flex flex-col dialog-in">

        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-(--admin-edge) flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50">Media Library</h2>
            <p className="text-[10.5px] sm:text-xs text-zinc-500">Choose existing media or upload new</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-(--admin-edge) shrink-0">
          <TabBtn active={tab === 'library'} onClick={() => setTab('library')} icon={<FileImage className="w-4 h-4" />} label="My Library" count={media.length} />
          <TabBtn active={tab === 'upload'} onClick={() => setTab('upload')} icon={<Upload className="w-4 h-4" />} label="Upload New" />
        </div>

        <div className="flex-1 overflow-hidden">
          {tab === 'library' ? (
            <LibraryView
              loading={loading}
              media={filteredMedia}
              accept={accept}
              filter={filter}
              setFilter={setFilter}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onDelete={handleDelete}
            />
          ) : (
            <UploadView
              uploading={uploading}
              uploadProgress={uploadProgress}
              uploadError={uploadError}
              dragOver={dragOver}
              setDragOver={setDragOver}
              acceptAttr={acceptAttr}
              accept={accept}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              handleDrop={handleDrop}
            />
          )}
        </div>

        <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-(--admin-edge) flex items-center justify-between gap-3 shrink-0">
          {/* "Click any file to select" is an instruction for a pointer, and
              on a phone it is also the line that leaves no room for the
              buttons. The count stays, the instruction goes. */}
          <p className="min-w-0 truncate text-[11px] sm:text-xs text-zinc-500">
            {selectedId
              ? '1 file selected'
              : <span className="hidden sm:inline">Click any file to select</span>}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="flex h-10 sm:h-auto items-center px-3.5 sm:px-4 sm:py-2 rounded-xl border border-(--admin-border) text-[13px] sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className="flex h-10 sm:h-auto items-center px-4 sm:px-5 sm:py-2 rounded-xl bg-zinc-900 text-white text-[13px] sm:text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40"
            >
              Use Selected
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function TabBtn({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-[13px] sm:text-sm font-medium transition-colors border-b-2 ${
        active
          ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
          : 'border-transparent text-zinc-500 dark:text-zinc-400'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function LibraryView({
  loading, media, accept, filter, setFilter, selectedId, setSelectedId, onDelete,
}: any) {
  return (
    <div className="h-full flex flex-col">
      {accept === 'all' && (
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-(--admin-edge) flex items-center gap-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          <FilterChip active={filter === 'image'} onClick={() => setFilter('image')} label="Images" icon={<ImageIcon className="w-3 h-3" />} />
          <FilterChip active={filter === 'video'} onClick={() => setFilter('video')} label="Videos" icon={<Video className="w-3 h-3" />} />
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-2 px-6 text-center">
          <FileImage className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">No media yet</p>
          <p className="text-xs">Switch to Upload New to add your first file</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {media.map((m: MediaAsset) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border-2 transition-all group ${
                  selectedId === m.id ? 'border-zinc-900 dark:border-zinc-400 ring-2 ring-zinc-900/20 dark:ring-zinc-400/20' : 'border-transparent hover:border-(--admin-field-border)'
                }`}
              >
                {m.type === 'video' ? (
                  <>
                    {/* A still, not the clip. Rendering <video src> here made
                        the grid download every video just to show a frame. */}
                    <img
                      src={videoPosterUrl(m.url)}
                      alt={m.filename}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Video className="w-6 h-6 text-white drop-shadow" />
                    </div>
                  </>
                ) : (
                  <img
                    src={thumbUrl(m.url)}
                    alt={m.filename}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                )}

                {selectedId === m.id && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Hidden until hover on a mouse, always there on a finger.
                    Left at zero opacity it was not merely invisible on a
                    phone, it was invisible and still tappable. */}
                <div
                  onClick={e => onDelete(m.id, e)}
                  className="absolute top-1.5 left-1.5 flex items-center justify-center rounded-md bg-black/50 text-white p-1 touch:p-1.5 opacity-0 group-hover:opacity-100 touch:opacity-100 hover:bg-red-500 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 touch:w-3.5 touch:h-3.5" />
                </div>

                <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-linear-to-t from-black/60 to-transparent">
                  <p className="text-[9px] text-white truncate">{m.filename}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UploadView({
  uploading, uploadProgress, uploadError, dragOver, setDragOver, acceptAttr, accept, fileInputRef, handleFileSelect, handleDrop,
}: any) {
  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-6">
      <div
        onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full max-w-md sm:aspect-3/2 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2.5 sm:gap-3 transition-all p-5 sm:p-6 ${
          dragOver ? 'border-zinc-900 dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-800' : 'border-(--admin-field-border) hover:border-(--admin-field-border-hover)'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-10 h-10 text-zinc-400 animate-spin" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-zinc-900 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-zinc-400" />
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Drag & drop a file here</p>
              <p className="text-xs text-zinc-400 mt-1">or click to browse</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-5 py-2 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-[10px] text-zinc-400 mt-2">
              {accept === 'image' && 'Images only (JPG, PNG, WebP, GIF)'}
              {accept === 'video' && 'Videos only (MP4, MOV, WebM)'}
              {accept === 'all' && 'Images and videos'}
            </p>
            {uploadError && (
              <p className="text-xs text-red-500 mt-2 text-center">{uploadError}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
        active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}