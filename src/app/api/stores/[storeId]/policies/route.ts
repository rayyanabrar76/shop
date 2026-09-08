import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ensurePolicies } from '@/lib/policies-db'
import { isPolicyKind } from '@/lib/policies'

/**
 * GET  /api/stores/[storeId]/policies          -> the shop's five policies
 * PUT  /api/stores/[storeId]/policies          { kind, content?, visible?, title? }
 *
 * One row per kind, always present. PUT only ever updates; there is nothing to
 * create because ensurePolicies has already made sure the row exists.
 */

async function owned(storeId: string) {
  const { userId } = await auth()
  if (!userId) return null
  const [dbUser, store] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } }),
    prisma.store.findUnique({ where: { id: storeId }, select: { ownerId: true, subdomain: true } }),
  ])
  if (!store || store.ownerId !== dbUser?.id) return null
  return store
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params
  if (!(await owned(storeId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await ensurePolicies(storeId)
  return NextResponse.json(rows.map(r => ({
    kind: r.kind,
    title: r.title,
    content: r.content,
    visible: r.visible,
    updatedAt: r.updatedAt,
  })))
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params
  const store = await owned(storeId)
  if (!store) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!isPolicyKind(body?.kind)) {
    return NextResponse.json({ error: 'Unknown policy' }, { status: 400 })
  }

  const data: { content?: string; visible?: boolean; title?: string } = {}
  if (typeof body.content === 'string') data.content = body.content.slice(0, 40_000)
  if (typeof body.visible === 'boolean') data.visible = body.visible
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 80)
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })
  }

  await ensurePolicies(storeId)
  const row = await prisma.storePolicy.update({
    where: { storeId_kind: { storeId, kind: body.kind } },
    data,
  })

  // The footer and the policy page itself are both server rendered from this.
  revalidatePath(`/store/${store.subdomain}`, 'layout')

  return NextResponse.json({
    kind: row.kind,
    title: row.title,
    content: row.content,
    visible: row.visible,
    updatedAt: row.updatedAt,
  })
}
