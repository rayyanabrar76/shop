import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function checkAuth(storeId: string) {
  const { userId } = await auth()
  if (!userId) return false
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  const store = await prisma.store.findUnique({ where: { id: storeId } })
  return store && store.ownerId === dbUser?.id
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
  if (!(await checkAuth(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const media = await prisma.mediaAsset.create({
    data: {
      storeId,
      url:      body.url,
      fileId:   body.fileId,
      filename: body.filename ?? 'untitled',
      type:     body.type ?? 'image',
      size:     body.size ?? null,
      width:    body.width ?? null,
      height:   body.height ?? null,
    },
  })
  return NextResponse.json(media)
}