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
  { params }: { params: Promise<{ storeId: string; pageId: string }> }
) {
  const { storeId, pageId } = await params

  if (!(await checkAuth(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { content } = await req.json()

  try {
    const page = await prisma.storePage.update({
      where: { id: pageId },
      data: { content },
    })
    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { subdomain: true } })
    if (store) revalidatePath(`/store/${store.subdomain}/${page.slug}`)
    return NextResponse.json(page)
  } catch {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }
}
