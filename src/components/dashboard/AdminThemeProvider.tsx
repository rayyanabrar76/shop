'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type AdminThemeMode = 'system' | 'light' | 'dark'

const AdminThemeContext = createContext<{
  mode: AdminThemeMode
  setMode: (m: AdminThemeMode) => void
}>({ mode: 'system', setMode: () => {} })

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}

function resolveIsDark(mode: AdminThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(mode: AdminThemeMode) {
  document.documentElement.setAttribute('data-theme', resolveIsDark(mode) ? 'dark' : 'light')
}

export function AdminThemeProvider({
  children,
  initialMode = 'system',
}: {
  children: React.ReactNode
  initialMode?: AdminThemeMode
}) {
  const [mode, setModeState] = useState<AdminThemeMode>(initialMode)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('admin-theme') as AdminThemeMode | null
    const resolved = (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : initialMode
    setModeState(resolved)
  }, [])

  useEffect(() => {
    if (!mounted) return
    applyTheme(mode)
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode, mounted])

  function setMode(m: AdminThemeMode) {
    setModeState(m)
    localStorage.setItem('admin-theme', m)
    applyTheme(m)
    fetch('/api/user/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: m }),
    }).catch(() => {})
  }

  return (
    <AdminThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </AdminThemeContext.Provider>
  )
}
