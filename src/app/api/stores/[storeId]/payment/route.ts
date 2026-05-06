import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params
    const payment = await prisma.storePayment.findUnique({ where: { storeId } })
    return NextResponse.json({ payment })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
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

    const body = await req.json()

    const payment = await prisma.storePayment.upsert({
      where: { storeId },
      create: { storeId, ...body },
      update: body,
    })

    return NextResponse.json({ ok: true, payment })
  } catch (err) {
    console.error('[payment:post]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}