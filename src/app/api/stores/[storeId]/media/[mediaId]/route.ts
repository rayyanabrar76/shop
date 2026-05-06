import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { imagekit } from '@/lib/imagekit'

async function checkAuth(storeId: string) {
  const { userId } = await auth()
  if (!userId) return false
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  const store = await prisma.store.findUnique({ where: { id: storeId } })
  return store && store.ownerId === dbUser?.id
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ storeId: string; mediaId: string }> }
) {
  const { storeId, mediaId } = await params
  if (!(await checkAuth(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } })
  if (!media || media.storeId !== storeId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete from ImageKit
  try {
    await imagekit.deleteFile(media.fileId)
  } catch (err) {
    console.error('ImageKit delete failed:', err)
    // Continue anyway — delete from DB even if ImageKit fails
  }

  await prisma.mediaAsset.delete({ where: { id: mediaId } })
  return NextResponse.json({ ok: true })
}