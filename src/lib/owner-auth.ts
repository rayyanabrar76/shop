import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Guard for merchant-side API routes under /api/stores/[storeId].
 *
 * Being signed in is not the same as owning the store in the URL. Several
 * routes checked only the former, which meant any signed-in user could act on
 * any store by editing the id — and routes that then looked their row up by id
 * alone (a rate id, a discount id) could reach rows belonging to a store the
 * caller had nothing to do with.
 *
 * Returns a response to hand straight back when the caller is not the owner,
 * and null when they are:
 *
 *     const denied = await requireStoreOwner(storeId)
 *     if (denied) return denied
 *
 * The reply is a flat 401 either way: signed out and "not your store" are told
 * apart deliberately nowhere, so this cannot be used to discover which store
 * ids exist.
 */
export async function requireStoreOwner(storeId: string): Promise<NextResponse | null> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId: userId } },
    select: { id: true },
  })
  if (!store) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return null
}
