import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const { name, subdomain } = await req.json()
  if (!name || !subdomain) {
    return NextResponse.json({ error: 'Name and subdomain are required' }, { status: 400 })
  }

  const dbUser =
    (await prisma.user.findUnique({ where: { clerkId: userId } })) ??
    (await prisma.user.create({
      data: {
        clerkId: userId,
        email,
      },
    }))

  const store = await prisma.store.create({
    data: {
      ownerId: dbUser.id,
      name,
      subdomain,
    },
  })

  return NextResponse.json(store)
}

