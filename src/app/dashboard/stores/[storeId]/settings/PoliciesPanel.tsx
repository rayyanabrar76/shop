'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Sparkles, Loader2, ExternalLink, Check } from 'lucide-react'
import { storeUrl } from '@/lib/config'
import { inputCls } from '@/components/dashboard/field-styles'
import {
  POLICY_KINDS, isPolicyWritten, policyStarter, policyHref, type PolicyKind,
} from '@/lib/policies'

interface PolicyRow {
  kind: PolicyKind
  title: string
  content: string
  visible: boolean
}

/**
 * Settings → Policies. The five policies a shop is expected to publish, each
 * with a status, a switch for the footer, and an editor that opens in place.
 *
 * The draft button is the point of the screen. A refund policy is a page most
 * people never get round to writing because they do not know what goes in
 * one; a draft written from the shop's own shipping rates and contact details
 * turns that into a read-and-correct job. It is offered as a draft and never
 * published on its own: what the model does not know it leaves as bracketed
 * blanks, and Save is a separate, deliberate press.
 */
export default function PoliciesPanel({ storeId, subdomain }: { storeId: string; subdomain: string }) {
  const [rows, setRows] = useState<PolicyRow[] | null>(null)
  const [open, setOpen] = useState<PolicyKind | null>(null)
  /** Text as edited, by kind. Absent means untouched since load. */
  const [edits, setEdits] = useState<Partial<Record<PolicyKind, string>>>({})
  const [saving, setSaving] = useState<PolicyKind | null>(null)
  const [drafting, setDrafting] = useState<PolicyKind | null>(null)
  const [savedFlash, setSavedFlash] = useState<PolicyKind | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let dropped = false
    fetch(`/api/stores/${storeId}/policies`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Could not load policies'))))
      .then((d: PolicyRow[]) => { if (!dropped) setRows(d) })
      .catch(e => { if (!dropped) setError(e instanceof Error ? e.message : 'Could not load policies') })
    return () => { dropped = true }
  }, [storeId])

  const base = storeUrl(subdomain)

  function textOf(row: PolicyRow) {
    return edits[row.kind] ?? row.content
  }

  async function put(kind: PolicyKind, patch: Partial<Pick<PolicyRow, 'content' | 'visible'>>) {
    const res = await fetch(`/api/stores/${storeId}/policies`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, ...patch }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || 'Could not save')
    }
    return res.json() as Promise<PolicyRow>
  }

  async function toggleVisible(row: PolicyRow) {
    const next = !row.visible
    // Optimistic: the switch moves now and is put back only if the save fails.
    setRows(rs => rs?.map(r => (r.kind === row.kind ? { ...r, visible: next } : r)) ?? rs)
    try {
      await put(row.kind, { visible: next })
    } catch (e) {
      setRows(rs => rs?.map(r => (r.kind === row.kind ? { ...r, visible: !next } : r)) ?? rs)
      setError(e instanceof Error ? e.message : 'Could not save')
    }
  }

  async function save(row: PolicyRow) {
    const content = textOf(row)
    setSaving(row.kind); setError('')
    try {
      const saved = await put(row.kind, { content })
      setRows(rs => rs?.map(r => (r.kind === row.kind ? { ...r, content: saved.content } : r)) ?? rs)
      setEdits(e => { const n = { ...e }; delete n[row.kind]; return n })
      setSavedFlash(row.kind)
      setTimeout(() => setSavedFlash(f => (f === row.kind ? null : f)), 1800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(null)
    }
  }

  async function draft(row: PolicyRow) {
    // Only ask before replacing something a person wrote. Prompts and blanks
    // are not worth a confirmation.
    if (isPolicyWritten(row.kind, textOf(row)) &&
        !window.confirm(`Replace your ${row.title.toLowerCase()} with a new draft? You can still edit it before saving.`)) return
    setDrafting(row.kind); setError('')
    try {
      const res = await fetch(`/api/stores/${storeId}/policies/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: row.kind }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Could not write a draft')
      setEdits(e => ({ ...e, [row.kind]: d.text as string }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not write a draft')
    } finally {
      setDrafting(null)
    }
  }

  return (
    <div className="space-y-3 md:space-y-5">
      <div className="bg-(--admin-card) rounded-xl md:rounded-2xl border border-(--admin-border) shadow-sm overflow-hidden">
        <div className="px-3.5 md:px-6 py-3 md:py-4 border-b border-(--admin-edge)">
          <h2 className="font-semibold text-[13px] md:text-sm text-zinc-800 dark:text-zinc-100">Policies</h2>
          <p className="text-[11px] md:text-xs text-zinc-500 mt-0.5 leading-relaxed">
            Linked from the checkout and the storefront footer once written. A policy that is hidden stays reachable by its address; one that is not written is not shown anywhere.
          </p>
        </div>

        {error && (
          <p className="mx-3.5 md:mx-6 mt-4 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {rows === null ? (
          <div className="divide-y divide-(--admin-edge)">
            {POLICY_KINDS.map(k => (
              <div key={k.kind} className="flex items-center gap-4 px-3.5 md:px-6 py-3.5 md:py-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-36 max-w-full rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-2.5 w-64 max-w-full rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
                <div className="h-5 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-(--admin-edge)">
            {rows.map(row => {
              const def = POLICY_KINDS.find(k => k.kind === row.kind)!
              const written = isPolicyWritten(row.kind, row.content)
              const isOpen = open === row.kind
              const dirty = row.kind in edits && edits[row.kind] !== row.content
              const status = !written
                ? { label: 'Not written', cls: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40', dot: 'bg-amber-500' }
                : row.visible
                  ? { label: 'Published', cls: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40', dot: 'bg-emerald-500' }
                  : { label: 'Hidden', cls: 'text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800', dot: 'bg-zinc-400' }

              return (
                <li key={row.kind}>
                  <div
                    className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-6 py-3 sm:py-3.5 cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    onClick={e => {
                      if ((e.target as HTMLElement).closest('button, a')) return
                      setOpen(isOpen ? null : row.kind)
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-[12.5px] sm:text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-50 truncate">{row.title}</p>
                        {/* On a phone the dot carries the state on its own:
                            the word beside it costs a third of the row and the
                            colour has already said it. */}
                        <span className={`inline-flex shrink-0 items-center gap-1.5 pl-1.5 pr-1.5 sm:pr-2 h-5 rounded-full text-[10.5px] font-medium ${status.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          <span className="hidden sm:inline">{status.label}</span>
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-[11.5px] text-zinc-500 mt-0.5 truncate">{def.blurb}</p>
                    </div>

                    {/* Footer switch. Only meaningful once written, so it is
                        dimmed until then rather than hidden: it says what
                        will happen when the policy exists. */}
                    <button
                      type="button"
                      onClick={() => toggleVisible(row)}
                      disabled={!written}
                      aria-label={row.visible ? 'Hide from footer' : 'Show in footer'}
                      title={written ? (row.visible ? 'Shown in the footer' : 'Hidden from the footer') : 'Shown in the footer once written'}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
                        row.visible ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-(--admin-card) shadow transition-transform ${row.visible ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>

                    <ChevronDown className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isOpen && (
                    <div className="px-3.5 sm:px-6 pb-4 sm:pb-5 pt-1 space-y-3 border-t border-(--admin-edge) bg-zinc-50/40 dark:bg-zinc-950/20">
                      <textarea
                        value={textOf(row)}
                        onChange={e => setEdits(ed => ({ ...ed, [row.kind]: e.target.value }))}
                        rows={14}
                        placeholder={policyStarter(row.kind)}
                        spellCheck
                        className={`${inputCls} mt-3 sm:mt-4 resize-y min-h-40 sm:min-h-48 text-[12.5px] sm:text-[13px] leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-500`}
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => draft(row)}
                          disabled={drafting === row.kind}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-(--admin-border) bg-(--admin-card) px-3 text-[11.5px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-(--admin-field-border) transition-colors disabled:opacity-60"
                        >
                          {drafting === row.kind
                            ? <><Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" /> <span className="hidden sm:inline">Writing from your store details…</span><span className="sm:hidden">Writing…</span></>
                            : <><Sparkles className="w-3.5 h-3.5" /> {written ? 'Redraft with AI' : 'Draft with AI'}</>}
                        </button>

                        <span className="flex-1" />

                        {written && row.visible && (
                          <a
                            href={policyHref(base, row.kind)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View on store
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => save(row)}
                          disabled={!dirty || saving === row.kind}
                          className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[11.5px] font-semibold transition-colors disabled:cursor-not-allowed ${
                            dirty || saving === row.kind
                              ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                          } ${savedFlash === row.kind ? 'admin-pop' : ''}`}
                        >
                          {saving === row.kind
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                            : savedFlash === row.kind
                              ? <><Check className="w-3.5 h-3.5" /> Saved</>
                              : 'Save'}
                        </button>
                      </div>

                      <p className="text-[11px] text-zinc-500">
                        Anything in [square brackets] in a draft is a detail only you can supply. Read the whole thing before you save it: it is a promise to your customers.
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
