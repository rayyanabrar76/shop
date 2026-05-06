import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signCustomerToken, COOKIE_NAME } from '@/lib/store-auth'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const subdomain = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error || !code || !subdomain) {
    return NextResponse.redirect(`${appUrl}/?error=google_auth_failed`)
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`

  // Exchange code for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/store/${subdomain}/login?error=google_auth_failed`)
  }

  const tokenData = await tokenRes.json()

  // Get Google user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!userRes.ok) {
    return NextResponse.redirect(`${appUrl}/store/${subdomain}/login?error=google_auth_failed`)
  }

  const googleUser = await userRes.json()
  const { id: googleId, email, name } = googleUser

  if (!email) {
    return NextResponse.redirect(`${appUrl}/store/${subdomain}/login?error=no_email`)
  }

  const store = await prisma.store.findUnique({ where: { subdomain } })
  if (!store) {
    return NextResponse.redirect(`${appUrl}/?error=store_not_found`)
  }

  // Find existing customer by email
  let customer = await prisma.storeCustomer.findUnique({
    where: { storeId_email: { storeId: store.id, email: email.toLowerCase() } },
  })

  if (customer) {
    // Link googleId if not already set
    if (!customer.googleId) {
      customer = await prisma.storeCustomer.update({
        where: { id: customer.id },
        data: { googleId },
      })
    }
  } else {
    // Create new StoreCustomer (no password needed)
    customer = await prisma.storeCustomer.create({
      data: {
        storeId: store.id,
        email: email.toLowerCase(),
        googleId,
        name: name ?? null,
        passwordHash: null,
      },
    })

    sendWelcomeEmail({ to: email.toLowerCase(), storeName: store.name, customerName: name ?? null, subdomain }).catch(() => {})

    // Also create Customer record so they appear in the dashboard
    await prisma.customer.upsert({
      where: { storeId_email: { storeId: store.id, email: email.toLowerCase() } },
      update: {},
      create: { storeId: store.id, email: email.toLowerCase(), name: name ?? null },
    })
  }

  const token = await signCustomerToken({
    customerId: customer.id,
    storeId: store.id,
    subdomain,
    email: customer.email,
    name: customer.name,
  })

  const res = NextResponse.redirect(`${appUrl}/store/${subdomain}`)
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return res
}
