'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Users, Search, ArrowUpDown, ArrowLeft, Mail, Calendar, UserX, Download } from 'lucide-react'

interface Customer { id: string; email: string; name: string | null; createdAt: Date; storeId: string }
interface Store { id: string; name: string }

export default function CustomersClient({ store, customers }: { store: Store; customers: Customer[] }) {
  const [search, setSearch] = useState('')
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/stores/${store.id}`} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200">
              <ArrowLeft size={16} />
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-2">
              <Users size={16} className="text-zinc-400 dark:text-zinc-500" />
              <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">Customers</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">{customers.length}</span>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Customers', value: customers.length },
            { label: 'This Month', value: customers.filter(c => { const d = new Date(c.createdAt); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).length },
            { label: 'This Week', value: customers.filter(c => new Date(c.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 px-5 py-4">
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-shadow placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {customers.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <UserX size={24} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="font-semibold text-zinc-700 dark:text-zinc-200">No customers yet</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">Customers appear here when they place an order or sign up through your store.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <Search size={28} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No customers match "{search}"</p>
            <button onClick={() => setSearch('')} className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 underline">Clear search</button>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/60">
              {[['name', 4, 'Customer'], ['email', 5, 'Email'], ['createdAt', 3, 'Joined']].map(([col, span, label]) => (
                <button key={col as string} onClick={() => toggleSort(col as typeof sortBy)} className={`col-span-${span} text-left text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors`}>
                  {label as string} <SortIcon col={col as typeof sortBy} />
                </button>
              ))}
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((c) => {
                const initials = getInitials(c.name, c.email)
                const color = getAvatarColor(c.email)
                const joined = new Date(c.createdAt)
                return (
                  <div key={c.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ backgroundColor: color }}>{initials}</div>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                        {c.name ?? <span className="text-zinc-400 dark:text-zinc-500 italic">No name</span>}
                      </span>
                    </div>
                    <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                      <Mail size={12} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                      <a href={`mailto:${c.email}`} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors truncate">{c.email}</a>
                    </div>
                    <div className="col-span-3 flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                      <Calendar size={12} className="shrink-0" />
                      <span className="text-xs">{joined.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/60">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Showing {filtered.length} of {customers.length} customers</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
