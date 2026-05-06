import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { imagekit } from '@/lib/imagekit'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Returns { token, expire, signature } needed for client-side upload
  const authParams = imagekit.getAuthenticationParameters()
  return NextResponse.json(authParams)
}