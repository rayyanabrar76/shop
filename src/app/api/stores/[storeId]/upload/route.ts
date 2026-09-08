import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { imagekit } from '@/lib/imagekit'
import { loadStoreEntitlements, assertStorage } from '@/lib/entitlements'
import { slugifyFileName } from '@/lib/upload-filename'

/**
 * POST /api/stores/[storeId]/upload  — one image, straight from a form.
 *
 * Uploads to ImageKit and records a MediaAsset, the same path the Media
 * Library and the AI generator use. It used to write into public/uploads and
 * return a local path, which works on a laptop and nowhere else: those files
 * are not part of the deployment, and the filesystem is ephemeral in
 * production, so every uploaded image 404'd once the shop went live.
 */

const MAX_BYTES = 10 * 1024 * 1024

function extFromMime(mime: string) {
  switch (mime) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return null
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    if (!store || store.ownerId !== dbUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 })
    }

    const ext = extFromMime(file.type)
    if (!ext) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const ent = await loadStoreEntitlements(storeId, userId)
    if (!ent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const limitErr = assertStorage(ent.store.storageUsed, file.size, ent.plan)
    if (limitErr) return limitErr

    const bytes = Buffer.from(await file.arrayBuffer())

    // Keeps the original name, which is what makes a file findable in the
    // library later and readable in the public URL, with a suffix so two
    // uploads called "donut.jpg" cannot collide.
    const uploaded = await imagekit.upload({
      file: bytes.toString('base64'),
      fileName: slugifyFileName(file.name, ext),
      folder: `/stores/${storeId}`,
    })

    await prisma.$transaction(async (tx) => {
      await tx.mediaAsset.create({
        data: {
          storeId,
          url: uploaded.url,
          fileId: uploaded.fileId,
          filename: uploaded.name,
          type: 'image',
          size: uploaded.size ?? file.size,
          width: uploaded.width ?? null,
          height: uploaded.height ?? null,
        },
      })
      await tx.store.update({
        where: { id: storeId },
        data: { storageUsed: { increment: BigInt(uploaded.size ?? file.size) } },
      })
    })

    return NextResponse.json({ url: uploaded.url })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Upload failed. Try again.' }, { status: 500 })
  }
}
