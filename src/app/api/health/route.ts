import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      uptime_ms: Date.now() - started,
      db: 'ok',
      ts: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'error',
        error: err instanceof Error ? err.message : 'Unknown',
        ts: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
