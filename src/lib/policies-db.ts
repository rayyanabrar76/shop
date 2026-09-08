import { prisma } from '@/lib/prisma'
import { POLICY_KINDS, isPolicyPublished, type PolicyKind } from '@/lib/policies'

/**
 * Database side of policies. Server only: this file imports Prisma.
 */

/**
 * Every shop has one row per kind. The migration backfilled existing shops
 * and store creation seeds new ones, but a shop that somehow lacks a row
 * should get one on first read rather than a broken settings screen.
 */
export async function ensurePolicies(storeId: string) {
  const have = await prisma.storePolicy.findMany({ where: { storeId } })
  const missing = POLICY_KINDS.filter(k => !have.some(h => h.kind === k.kind))
  if (missing.length === 0) return have.sort(byKindOrder)

  await prisma.storePolicy.createMany({
    data: missing.map(k => ({ storeId, kind: k.kind, title: k.title })),
    skipDuplicates: true,
  })
  return (await prisma.storePolicy.findMany({ where: { storeId } })).sort(byKindOrder)
}

/** The ones the storefront may show: written, and not hidden. */
export async function publishedPolicies(storeId: string) {
  const rows = await prisma.storePolicy.findMany({
    where: { storeId },
    select: { kind: true, title: true, content: true, visible: true },
  })
  return rows
    .filter(r => isPolicyPublished({ kind: r.kind as PolicyKind, content: r.content, visible: r.visible }))
    .sort(byKindOrder)
    .map(r => ({ kind: r.kind as PolicyKind, title: r.title }))
}

/** Settings order, which is also the footer order: the ones a shopper asks
 *  about most often first. */
function byKindOrder(a: { kind: string }, b: { kind: string }) {
  const i = POLICY_KINDS.findIndex(k => k.kind === a.kind)
  const j = POLICY_KINDS.findIndex(k => k.kind === b.kind)
  return i - j
}
