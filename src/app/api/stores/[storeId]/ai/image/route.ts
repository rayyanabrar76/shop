import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { imagekit } from '@/lib/imagekit'
import { loadStoreEntitlements, assertStorage } from '@/lib/entitlements'
import { generateProductImage, ImageGenError } from '@/lib/ai/images'

/**
 * POST /api/stores/[storeId]/ai/image
 * { description } -> { url, model }
 *
 * The generated photo goes to ImageKit and gets a MediaAsset row, exactly like
 * a file uploaded through the Media Library. That is what makes it show up in
 * the library afterwards — and it is the only storage that survives a deploy,
 * since the app's filesystem is ephemeral in production.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { storeId } = await params

    // Generation costs money, so confirm ownership before calling out.
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { ownerId: true } })
    if (!store || store.ownerId !== dbUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const description = typeof body?.description === 'string' ? body.description.trim() : ''
    if (!description) {
      return NextResponse.json({ error: 'Describe the image you want.' }, { status: 400 })
    }
    if (description.length > 500) {
      return NextResponse.json({ error: 'Description is too long (max 500 characters).' }, { status: 400 })
    }

    // Favicons need a flat mark, not a photograph.
    const style = body?.style === 'icon' ? 'icon' : 'product'
    const { bytes, model } = await generateProductImage(description, { style })

    const ent = await loadStoreEntitlements(storeId, userId)
    if (!ent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const limitErr = assertStorage(ent.store.storageUsed, bytes.length, ent.plan)
    if (limitErr) return limitErr

    // Name it after the prompt so it is findable in the library later.
    const stub = description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'product'

    const uploaded = await imagekit.upload({
      file: bytes.toString('base64'),
      fileName: `ai-${stub}-${Date.now()}.jpg`,
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
          size: uploaded.size ?? bytes.length,
          width: uploaded.width ?? null,
          height: uploaded.height ?? null,
        },
      })
      await tx.store.update({
        where: { id: storeId },
        data: { storageUsed: { increment: BigInt(uploaded.size ?? bytes.length) } },
      })
    })

    return NextResponse.json({ url: uploaded.url, model })
  } catch (err) {
    if (err instanceof ImageGenError) {
      console.error('[ai:image]', err.message)
      // Rewording cannot fix an exhausted allowance, so do not suggest it.
      if (err.quota) {
        return NextResponse.json(
          {
            error: 'Image generation has hit its daily limit on this Cloudflare account. It resets each day, or upgrade the Workers Paid plan to carry on now.',
            quota: true,
            // The written prompt is the valuable part and costs nothing to
            // return, so it can be pasted into another image tool meanwhile.
            prompt: err.prompt ?? '',
          },
          { status: 429 },
        )
      }
      return NextResponse.json(
        { error: 'Could not generate that image. Try rephrasing your description.' },
        { status: 502 },
      )
    }
    console.error('[ai:image]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
