import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { adminTheme: true },
  })

  return NextResponse.json({ theme: user?.adminTheme ?? 'system' })
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { theme } = body

  if (theme !== 'system' && theme !== 'light' && theme !== 'dark') {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
  }

  await prisma.user.update({
    where: { clerkId: userId },
    data: { adminTheme: theme },
  })

  return NextResponse.json({ success: true })
}
