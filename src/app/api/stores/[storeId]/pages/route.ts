import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function checkAuth(storeId: string) {
  const { userId } = await auth()
  if (!userId) return false
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })
  const store = await prisma.store.findUnique({ where: { id: storeId } })
  return store && store.ownerId === dbUser?.id
}

function getDefaultContent(type: string, name: string): object {
  switch (type) {
    case 'faq':
      return {
        heading: name,
        items: [
          { id: '1', q: 'What is your return policy?', a: 'We offer a 30-day return policy...' },
          { id: '2', q: 'How long does shipping take?', a: 'Standard shipping takes 5-7 business days.' },
          { id: '3', q: 'Do you offer international shipping?', a: 'Yes, we ship to most countries worldwide.' },
        ],
      }
    case 'about':
      return {
        heading: name,
        intro: 'We are passionate about bringing you the best products.',
        story: 'Founded with a simple idea: bring quality to everyone.',
        mission: 'Our mission is to provide exceptional products and outstanding service.',
        imageUrl: null,
      }
    case 'contact':
      return {
        heading: name,
        intro: "We'd love to hear from you.",
        address: '123 Main Street, City, Country',
        email: 'hello@yourstore.com',
        phone: '+1 (234) 567-8900',
      }
    case 'shipping':
      return {
        heading: name,
        content:
          'We process all orders within 1-2 business days...\n\nStandard Shipping: 5-7 business days\nExpress Shipping: 2-3 business days\nInternational: 10-21 business days\n\nShipping costs are calculated at checkout.',
      }
    case 'privacy':
      return {
        heading: name,
        content:
          'Your privacy is important to us...\n\nInformation We Collect\nWe collect information you provide when making a purchase including name, email, and payment info.\n\nHow We Use Your Information\nWe use it to process transactions and send order confirmations.\n\nData Security\nWe implement appropriate security measures to protect your data.\n\nContact Us\nIf you have questions, please email us.',
      }
    case 'terms':
      return {
        heading: name,
        content:
          'By using our store, you agree to these Terms of Service.\n\nUse of Our Store\nYou may use our store for lawful purposes only.\n\nProducts and Pricing\nWe reserve the right to modify prices at any time.\n\nReturns and Refunds\nPlease refer to our Return Policy.\n\nIntellectual Property\nAll content on this site is our property and protected by copyright.\n\nLimitation of Liability\nWe are not liable for indirect or consequential damages.',
      }
    case 'blog':
      return {
        heading: name,
        intro: 'Stay tuned for updates and articles from our team.',
      }
    default:
      return {
        heading: name,
        content: 'Add your content here.',
      }
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  const pages = await prisma.storePage.findMany({
    where: { storeId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(pages)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  if (!(await checkAuth(storeId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type, name, slug } = await req.json()
  if (!type || !name || !slug) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const content = getDefaultContent(type, name)

  try {
    const page = await prisma.storePage.create({
      data: { storeId, type, name, slug, content },
    })
    return NextResponse.json(page)
  } catch {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
  }
}
