import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import dns from 'dns/promises'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params
    const { domain } = await req.json()

    if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 })

    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check if domain is already taken by another store
    const existing = await prisma.store.findFirst({
      where: { customDomain: domain, NOT: { id: storeId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'This domain is already connected to another store.' }, { status: 409 })
    }

    // Try to verify DNS
    let verified = false
    let dnsError = ''

    try {
      const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000'
      const records = await dns.resolveCname(domain)
      verified = records.some(r => r.includes(rootDomain) || r.includes('vercel'))
    } catch (e) {
      // CNAME not found, try A record
      try {
        const addresses = await dns.resolve4(domain)
        // If any IP resolves, DNS is at least set up
        verified = addresses.length > 0
        dnsError = 'CNAME not found — make sure you added the CNAME record'
      } catch {
        dnsError = 'Domain DNS not configured yet'
      }
    }

    // Save domain regardless (store owner can add DNS later)
    await prisma.store.update({
      where: { id: storeId },
      data: {
        customDomain: domain,
        domainVerified: verified,
      },
    })

    return NextResponse.json({
      ok: true,
      verified,
      message: verified
        ? 'Domain verified and connected!'
        : `Domain saved. ${dnsError} — add the DNS records shown below then verify again.`,
    })
  } catch (err) {
    console.error('[domain:verify]', err)
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params

    await prisma.store.update({
      where: { id: storeId },
      data: { customDomain: null, domainVerified: false },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to remove domain' }, { status: 500 })
  }
}