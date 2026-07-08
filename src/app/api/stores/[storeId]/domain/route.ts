import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import dns from 'dns/promises'
import { loadStoreEntitlements, assertCustomDomain } from '@/lib/entitlements'
import { addVercelDomain, removeVercelDomain, getVercelDomainStatus } from '@/lib/vercel'

const VALID_DOMAIN = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params
    const { domain } = (await req.json()) as { domain: string }

    if (!domain || !VALID_DOMAIN.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
    }

    const ent = await loadStoreEntitlements(storeId, clerkId)
    if (!ent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const planErr = assertCustomDomain(ent.plan)
    if (planErr) return planErr

    // Domain uniqueness across stores
    const existing = await prisma.store.findFirst({
      where: { customDomain: domain, NOT: { id: storeId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'This domain is already connected to another store.' }, { status: 409 })
    }

    // Register with Vercel (so SSL is provisioned)
    let vercelOk = false
    let vercelReason: string | undefined
    if (process.env.VERCEL_TOKEN) {
      try {
        const status = await addVercelDomain(domain)
        vercelOk = status.verified
        vercelReason = status.reason
      } catch (e) {
        console.error('[domain] Vercel API error', e)
        vercelReason = 'Vercel API error'
      }
    } else {
      vercelReason = 'VERCEL_TOKEN not configured — domain stored but SSL not auto-provisioned'
    }

    // Verify CNAME points at our platform (defense-in-depth on top of Vercel's check)
    const root = process.env.NEXT_PUBLIC_APP_DOMAIN ?? ''
    let cnameOk = false
    try {
      const records = await dns.resolveCname(domain)
      cnameOk = records.some(
        (r) => r.includes(root) || r.endsWith('.vercel-dns.com') || r.endsWith('.vercel.app'),
      )
    } catch {
      cnameOk = false
    }

    const verified = vercelOk && cnameOk

    await prisma.store.update({
      where: { id: storeId },
      data: { customDomain: domain, domainVerified: verified },
    })

    return NextResponse.json({
      ok: true,
      verified,
      vercelOk,
      cnameOk,
      message: verified
        ? 'Domain connected and verified.'
        : vercelReason ?? 'Domain saved. Add the CNAME record shown below, then verify.',
    })
  } catch (err) {
    console.error('[domain:verify]', err)
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params
    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
      select: { customDomain: true, domainVerified: true },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let live = false
    if (store.customDomain && process.env.VERCEL_TOKEN) {
      try {
        const status = await getVercelDomainStatus(store.customDomain)
        live = status.verified
      } catch {}
    }
    return NextResponse.json({ ...store, live })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
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
    const store = await prisma.store.findFirst({
      where: { id: storeId, owner: { clerkId } },
    })
    if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (store.customDomain && process.env.VERCEL_TOKEN) {
      try { await removeVercelDomain(store.customDomain) } catch {}
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { customDomain: null, domainVerified: false },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to remove domain' }, { status: 500 })
  }
}
