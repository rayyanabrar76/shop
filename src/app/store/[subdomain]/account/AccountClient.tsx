'use client'

import Link from 'next/link'
import { ShoppingBag, User, Mail, Phone, Calendar } from 'lucide-react'
import { useAuth } from '../auth-context'

interface Customer {
  id: string
  email: string
  name?: string | null
  phone?: string | null
  createdAt: Date | string
}

interface Theme {
  primaryColor: string
  borderRadius: string
  headingFont: string
}

export default function AccountClient({
  customer,
  subdomain,
  theme,
}: {
  customer: Customer
  subdomain: string
  theme: Theme
}) {
  const { logout } = useAuth()
  const { primaryColor, headingFont } = theme

  const joinDate = new Date(customer.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ fontFamily: headingFont === 'serif' ? 'serif' : 'inherit' }}
        >
          My Account
        </h1>
        <p className="text-sm opacity-50 mt-1">Manage your account details</p>
      </div>

      {/* Profile card */}
      <div className="border border-zinc-200 rounded-2xl p-6 space-y-4 bg-white mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {((customer.name ?? customer.email)[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg">{customer.name ?? 'Customer'}</p>
            <p className="text-sm opacity-60">{customer.email}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="w-4 h-4 opacity-40" />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="w-4 h-4 opacity-40" />
              <span>{customer.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm">
            <Calendar className="w-4 h-4 opacity-40" />
            <span className="opacity-60">Member since {joinDate}</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href={`/store/${subdomain}/account/orders`}
          className="flex items-center gap-4 p-5 border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-colors bg-white"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}18` }}
          >
            <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="font-bold text-sm">Order History</p>
            <p className="text-xs opacity-50">View all your orders</p>
          </div>
        </Link>

        <Link
          href={`/store/${subdomain}/products`}
          className="flex items-center gap-4 p-5 border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-colors bg-white"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}18` }}
          >
            <User className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="font-bold text-sm">Continue Shopping</p>
            <p className="text-xs opacity-50">Browse all products</p>
          </div>
        </Link>
      </div>

      <button
        onClick={() => logout(subdomain)}
        className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
