import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loadStoreEntitlements, assertStorage } from '@/lib/entitlements'

async function checkAuth(storeId: string) {
  const { userId } = await auth()
  if (!userId) return null
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store || store.ownerId !== dbUser?.id) return null
  return userId
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  if (!(await checkAuth(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const media = await prisma.mediaAsset.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(media)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  const userId = await checkAuth(storeId)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const ent = await loadStoreEntitlements(storeId, userId)
  if (!ent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sizeBytes = Number(body.size ?? 0)
  const limitErr = assertStorage(ent.store.storageUsed, sizeBytes, ent.plan)
  if (limitErr) return limitErr

  const media = await prisma.$transaction(async (tx) => {
    const asset = await tx.mediaAsset.create({
      data: {
        storeId,
        url:      body.url,
        fileId:   body.fileId,
        filename: body.filename ?? 'untitled',
        type:     body.type ?? 'image',
        size:     sizeBytes || null,
        width:    body.width ?? null,
        height:   body.height ?? null,
      },
    })
    if (sizeBytes > 0) {
      await tx.store.update({
        where: { id: storeId },
        data: { storageUsed: { increment: BigInt(sizeBytes) } },
      })
    }
    return asset
  })

  return NextResponse.json(media)
}
