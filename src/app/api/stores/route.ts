import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateSubdomain } from '@/lib/subdomain'
import { DEFAULT_PAGES, starterContent } from '@/lib/default-pages'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: { name?: unknown; subdomain?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const subdomain = typeof body.subdomain === 'string' ? body.subdomain.trim().toLowerCase() : ''

    if (!name) return NextResponse.json({ error: 'Store name is required.' }, { status: 400 })
    if (name.length > 100) {
      return NextResponse.json({ error: 'Store name must be 100 characters or fewer.' }, { status: 400 })
    }

    const subdomainError = validateSubdomain(subdomain)
    if (subdomainError) return NextResponse.json({ error: subdomainError }, { status: 400 })

    const taken = await prisma.store.findUnique({
      where: { subdomain },
      select: { id: true },
    })
    if (taken) {
      return NextResponse.json({ error: 'That subdomain is already taken.' }, { status: 409 })
    }

    // Look the user up by Clerk id first; fall back to email so an account that
    // was re-created in Clerk reuses its existing row instead of tripping the
    // unique email constraint.
    let dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!dbUser) {
      const user = await currentUser()
      const email = user?.emailAddresses?.[0]?.emailAddress
      if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

      const byEmail = await prisma.user.findUnique({ where: { email } })
      dbUser = byEmail
        ? await prisma.user.update({ where: { id: byEmail.id }, data: { clerkId: userId } })
        : await prisma.user.create({ data: { clerkId: userId, email } })
    }

    const store = await prisma.store.create({
      data: {
        ownerId: dbUser.id,
        name,
        subdomain,
        // Provision the default theme + payment rows up front so the
        // customization and payment pages have something to read.
        theme: { create: {} },
        payment: { create: {} },
        // Every shop is expected to publish these, so they exist from the
        // start rather than being discovered when a customer asks. They stay
        // out of the storefront footer until they are actually written.
        pages: {
          create: DEFAULT_PAGES.map(p => ({
            type: p.type,
            name: p.name,
            slug: p.slug,
            content: starterContent(p),
          })),
        },
      },
      // Select explicitly: the Store model has a BigInt column (storageUsed)
      // that JSON.stringify cannot serialize, which would 500 the response
      // after the store had already been written.
      select: { id: true, name: true, subdomain: true },
    })

    return NextResponse.json(store, { status: 201 })
  } catch (err) {
    // Unique-constraint race between the availability check and the insert.
    if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'That subdomain is already taken.' }, { status: 409 })
    }
    console.error('[stores:post]', err)
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
  }
}
