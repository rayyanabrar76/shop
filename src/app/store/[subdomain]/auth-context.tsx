'use client'

import { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface CustomerSession {
  customerId: string
  email: string
  name?: string | null
}

interface AuthContextValue {
  customer: CustomerSession | null
  setCustomer: (c: CustomerSession | null) => void
  logout: (subdomain: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  initialCustomer,
}: {
  children: React.ReactNode
  initialCustomer: CustomerSession | null
}) {
  const [customer, setCustomer] = useState<CustomerSession | null>(initialCustomer)
  const router = useRouter()

  async function logout(subdomain: string) {
    await fetch(`/api/storefront/${subdomain}/auth/logout`, { method: 'POST' })
    setCustomer(null)
    router.refresh()
  }

  return (
    <AuthContext.Provider value={{ customer, setCustomer, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
