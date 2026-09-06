import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateSubdomain } from '@/lib/subdomain'

// GET /api/stores/check-subdomain?value=my-store[&storeId=...]
// Live availability check for the create-store form and settings page.
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const value = (searchParams.get('value') ?? '').trim().toLowerCase()
    const storeId = searchParams.get('storeId')

    const error = validateSubdomain(value)
    if (error) return NextResponse.json({ available: false, error })

    const existing = await prisma.store.findUnique({
      where: { subdomain: value },
      select: { id: true },
    })
    if (existing && existing.id !== storeId) {
      return NextResponse.json({ available: false, error: 'That subdomain is already taken.' })
    }

    return NextResponse.json({ available: true, error: null })
  } catch (err) {
    console.error('[stores:check-subdomain]', err)
    return NextResponse.json({ error: 'Failed to check subdomain' }, { status: 500 })
  }
}
