'use client'

import { useState } from 'react'
import { HiX } from 'react-icons/hi'

/**
 * Chip input for product search keywords. Enter or comma commits a tag;
 * backspace on an empty box removes the last one.
 */
export default function TagsInput({
  value,
  onChange,
  max = 20,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  max?: number
}) {
  const [draft, setDraft] = useState('')

  function commit(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/^#/, '')
    if (!tag) return
    if (value.includes(tag) || value.length >= max) { setDraft(''); return }
    onChange([...value, tag])
    setDraft('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-2 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-colors">
      {value.map(tag => (
        <span
          key={tag}
          className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-200"
        >
          {tag}
          <button
            onClick={() => onChange(value.filter(t => t !== tag))}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <HiX className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => {
          // A pasted "a, b, c" should become three tags, not one.
          if (e.target.value.includes(',')) {
            const parts = e.target.value.split(',')
            const last = parts.pop() ?? ''
            parts.forEach(commit)
            setDraft(last)
          } else {
            setDraft(e.target.value)
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit(draft) }
          if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={() => commit(draft)}
        placeholder={value.length ? '' : 'e.g. candle, soy wax, gift'}
        className="flex-1 min-w-24 bg-transparent text-sm outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 px-1"
      />
    </div>
  )
}
