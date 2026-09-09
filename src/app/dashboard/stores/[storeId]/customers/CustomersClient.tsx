'use client'

import { useState, useMemo } from 'react'
import PageHeader from '@/components/dashboard/PageHeader'
import { Users, Search, ArrowUpDown, Mail, Calendar, UserX, Download } from 'lucide-react'

interface Customer { id: string; email: string; name: string | null; createdAt: Date; storeId: string }
interface Store { id: string; name: string }

/**
 * The three columns, with their widths written out.
 *
 * Written out because they used to be built as `col-span-${span}` from a
 * number, and Tailwind reads source text rather than running it: none of those
 * classes existed, so every heading collapsed into one column while the rows
 * underneath used real spans and the two never lined up.
 *
 * The avatar takes the first column of twelve, which is why these add to
 * eleven rather than twelve.
 */
const COLUMNS = [
  { key: 'name'      as const, label: 'Customer', span: 'md:col-span-3' },
  { key: 'email'     as const, label: 'Email',    span: 'md:col-span-5' },
  { key: 'createdAt' as const, label: 'Joined',   span: 'md:col-span-3' },
]

export default function CustomersClient({
  store, customers, initialSearch = '',
}: { store: Store; customers: Customer[]; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers
      .filter(c => c.email.toLowerCase().includes(q) || (c.name ?? '').toLowerCase().includes(q))
      .sort((a, b) => {
        let av: string | number, bv: string | number
        if (sortBy === 'createdAt') { av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime() }
        else if (sortBy === 'name') { av = (a.name ?? '').toLowerCase(); bv = (b.name ?? '').toLowerCase() }
        else { av = a.email.toLowerCase(); bv = b.email.toLowerCase() }
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [customers, search, sortBy, sortDir])

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  function exportCSV() {
    const rows = [['Name', 'Email', 'Joined'], ...filtered.map(c => [c.name ?? '', c.email, new Date(c.createdAt).toLocaleDateString()])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${store.name}-customers.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function getInitials(name: string | null, email: string) {
    if (name) {
      const parts = name.trim().split(' ')
      return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  function getAvatarColor(str: string) {
    const colors = ['#6c47ff', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <ArrowUpDown size={12} className={`ml-1 inline transition-opacity ${sortBy === col ? 'opacity-100' : 'opacity-30'}`} />
  )

  return (
    <div className="min-h-full bg-(--admin-page)">
      {/* Header */}
      <PageHeader
        storeId={store.id}
        icon={<Users size={20} strokeWidth={1.75} />}
        title="Customers"
        count={customers.length}
        action={
          <button
            onClick={exportCSV}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-(--admin-border) bg-(--admin-card) px-3 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 hover:border-(--admin-field-border) transition-colors"
          >
            <Download size={13} /> <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">CSV</span>
          </button>
        }
      />

      <div className="max-w-6xl px-3.5 md:px-6 pb-10">
        {/* Three across even on a phone. They are three readings of the same
            number and only mean anything next to each other, so they shrink
            rather than stack. */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
          {[
            { label: 'Total Customers', value: customers.length },
            { label: 'This Month', value: customers.filter(c => { const d = new Date(c.createdAt); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).length },
            { label: 'This Week', value: customers.filter(c => new Date(c.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length },
          ].map(stat => (
            <div key={stat.label} className="bg-(--admin-card) rounded-xl md:rounded-2xl border border-(--admin-border) px-3 md:px-5 py-2.5 md:py-4">
              <p className="text-[9.5px] md:text-xs font-semibold text-zinc-500 uppercase tracking-wider leading-tight">{stat.label}</p>
              <p className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5 md:mt-1 tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-(--admin-card) border border-(--admin-border) rounded-xl text-[13px] md:text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-shadow placeholder:text-zinc-500"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {customers.length === 0 ? (
          <div className="text-center px-4 py-14 md:py-24 bg-(--admin-card) rounded-xl md:rounded-2xl border-2 border-dashed border-(--admin-border)">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 md:mb-4">
              <UserX size={22} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-[13px] md:text-base font-semibold text-zinc-700 dark:text-zinc-200">No customers yet</p>
            <p className="text-[11.5px] md:text-sm text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">Customers appear here when they place an order or sign up through your store.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center px-4 py-12 md:py-16 bg-(--admin-card) rounded-xl md:rounded-2xl border border-(--admin-border)">
            <Search size={28} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No customers match &quot;{search}&quot;</p>
            <button onClick={() => setSearch('')} className="mt-2 text-xs text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 underline">Clear search</button>
          </div>
        ) : (
          <div className="bg-(--admin-card) rounded-xl md:rounded-2xl border border-(--admin-border) overflow-hidden">
            {/* A column header is a place to click as much as a label, so on a
                phone, where there are no columns, the same three become a row
                of chips rather than disappearing and taking sorting with
                them. */}
            <div className="flex md:hidden items-center gap-1.5 px-3 py-2 border-b border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 mr-0.5">Sort</span>
              {COLUMNS.map(col => (
                <button
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`rounded-md px-2 py-1 text-[10.5px] font-semibold transition-colors ${
                    sortBy === col.key
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {col.label}
                  {sortBy === col.key && <span className="ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>}
                </button>
              ))}
            </div>

            <div className="hidden md:grid grid-cols-12 px-5 py-3 border-b border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
              {/* The avatar's column, so the labels sit over their own values. */}
              <span className="col-span-1" />
              {COLUMNS.map(col => (
                <button
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`${col.span} text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors`}
                >
                  {col.label} <SortIcon col={col.key} />
                </button>
              ))}
            </div>

            <div className="divide-y divide-(--admin-edge)">
              {filtered.map((c) => {
                const initials = getInitials(c.name, c.email)
                const color = getAvatarColor(c.email)
                const joined = new Date(c.createdAt)
                return (
                  /* One row of markup, arranged two ways. On a phone the three
                     values stack beside the avatar; from md the same three
                     become grid cells, which md:contents lets them do without
                     a second copy of the row to keep in step. */
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-3.5 md:px-5 py-2.5 md:py-3.5 md:grid md:grid-cols-12 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 md:col-span-1 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1 md:contents">
                      <span className={`${COLUMNS[0].span} block truncate text-[13px] md:text-sm font-medium text-zinc-800 dark:text-zinc-100`}>
                        {c.name ?? <span className="text-zinc-500 italic">No name</span>}
                      </span>

                      <span className={`${COLUMNS[1].span} flex items-center gap-1.5 min-w-0`}>
                        <Mail size={12} className="hidden md:block text-zinc-300 dark:text-zinc-600 shrink-0" />
                        <a
                          href={`mailto:${c.email}`}
                          className="text-[11.5px] md:text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors truncate"
                        >
                          {c.email}
                        </a>
                      </span>
                    </div>

                    {/* Shorter on a phone: the year is the least useful part of
                        a date most people read as "recently". */}
                    <span className={`${COLUMNS[2].span} flex shrink-0 items-center gap-1.5 text-zinc-500`}>
                      <Calendar size={12} className="hidden md:block shrink-0" />
                      <span className="hidden md:inline text-xs">
                        {joined.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="md:hidden text-[10.5px] tabular-nums">
                        {joined.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-t border-(--admin-edge) bg-zinc-50/60 dark:bg-zinc-800/60">
              <p className="text-[11px] md:text-xs text-zinc-500">Showing {filtered.length} of {customers.length} customers</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
