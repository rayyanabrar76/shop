import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

async function checkAuth(storeId: string) {
  const { userId } = await auth()
  if (!userId) return false
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  const store = await prisma.store.findUnique({ where: { id: storeId } })
  return store && store.ownerId === dbUser?.id
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; sectionId: string }> }
) {
  const { storeId, sectionId } = await params
  if (!(await checkAuth(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const section = await prisma.customSection.update({
    where: { id: sectionId },
    data: {
      name:          body.name,
      layout:        body.layout,
      heading:       body.heading,
      text:          body.text,
      imageUrl:      body.imageUrl,
      buttonLabel:   body.buttonLabel,
      buttonUrl:     body.buttonUrl,
      buttonVariant: body.buttonVariant,
      buttonRadius:  body.buttonRadius,
      buttonColor:   body.buttonColor,
      buttonFont:    body.buttonFont,
      showButton:    body.showButton,
      categoryIds: body.categoryIds ?? undefined,
      showCount: body.showCount ?? undefined,
      bgColor:       body.bgColor,
      position:      body.position,
      visible:       body.visible,
    },
  })

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { subdomain: true } })
  if (store) revalidatePath(`/store/${store.subdomain}`, 'layout')

  return NextResponse.json(section)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ storeId: string; sectionId: string }> }
) {
  const { storeId, sectionId } = await params
  if (!(await checkAuth(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.customSection.delete({ where: { id: sectionId } })

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { subdomain: true } })
  if (store) revalidatePath(`/store/${store.subdomain}`, 'layout')

  return NextResponse.json({ ok: true })
}