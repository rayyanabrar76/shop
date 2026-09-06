import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  const { searchParams } = new URL(req.url)
  const pageIdParam = searchParams.get('pageId')
  const pageId = (pageIdParam === null || pageIdParam === 'home') ? null : pageIdParam

  const sections = await prisma.customSection.findMany({
    where: { storeId, pageId },
    orderBy: { position: 'asc' },
  })
  return NextResponse.json(sections)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId } = await params
  const body = await req.json()

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store || store.ownerId !== dbUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pageId: string | null = body.pageId ?? null

  // Find max position for ordering, scoped to this page
  const last = await prisma.customSection.findFirst({
    where: { storeId, pageId },
    orderBy: { position: 'desc' },
  })
  const position = (last?.position ?? -1) + 1

  const section = await prisma.customSection.create({
    data: {
      storeId,
      pageId,
      name:        body.name        ?? 'Custom Section',
      layout:      body.layout      ?? 'heading-text',
      heading:     body.heading     ?? '',
      text:        body.text        ?? '',
      imageUrl:      body.imageUrl      ?? null,
      buttonLabel:   body.buttonLabel   ?? null,
      buttonUrl:     body.buttonUrl     ?? null,
      buttonVariant: body.buttonVariant ?? null,
      buttonRadius:  body.buttonRadius  ?? null,
      buttonColor:   body.buttonColor   ?? null,
      buttonFont:    body.buttonFont    ?? null,
      showButton:    body.showButton    ?? false,
      categoryIds: body.categoryIds ?? undefined,
      showCount: body.showCount ?? undefined,
      bgColor:       body.bgColor       ?? null,
      position,
      visible:     body.visible ?? true,
    },
  })

  revalidatePath(`/store/${store.subdomain}`, 'layout')

  return NextResponse.json(section)
}