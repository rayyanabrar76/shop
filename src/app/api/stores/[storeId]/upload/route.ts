import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

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

  const bytes = Buffer.from(await file.arrayBuffer())
  const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', storeId)
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), bytes)

  return NextResponse.json({ url: `/uploads/${storeId}/${filename}` })
}

