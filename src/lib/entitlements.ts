import { prisma } from '@/lib/prisma'
import { getActivePlan, type PlanDefinition } from '@/lib/plans'
import { NextResponse } from 'next/server'

export interface StoreWithPlan {
  id: string
  ownerId: string
  plan: 'FREE' | 'BASIC' | 'PRO'
  subscriptionStatus: string | null
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  storageUsed: bigint
}

export async function loadStoreEntitlements(
  storeId: string,
  clerkId: string,
): Promise<{ store: StoreWithPlan; plan: PlanDefinition } | null> {
  const store = await prisma.store.findFirst({
    where: { id: storeId, owner: { clerkId } },
    select: {
      id: true,
      ownerId: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      storageUsed: true,
    },
  })
  if (!store) return null
  const plan = getActivePlan(store)
  return { store: store as StoreWithPlan, plan }
}

export function planError(reason: string, upgradeTo?: 'BASIC' | 'PRO') {
  return NextResponse.json(
    { error: reason, upgradeRequired: true, upgradeTo: upgradeTo ?? 'BASIC' },
    { status: 402 },
  )
}

export async function assertProductLimit(storeId: string, plan: PlanDefinition) {
  if (plan.limits.maxProducts === -1) return null
  const count = await prisma.product.count({ where: { storeId } })
  if (count >= plan.limits.maxProducts) {
    return planError(
      `Your ${plan.name} plan allows ${plan.limits.maxProducts} products. Upgrade for unlimited.`,
      'BASIC',
    )
  }
  return null
}

export async function assertDiscountLimit(storeId: string, plan: PlanDefinition) {
  if (plan.limits.maxActiveDiscounts === -1) return null
  const count = await prisma.discountCode.count({ where: { storeId, active: true } })
  if (count >= plan.limits.maxActiveDiscounts) {
    return planError(
      `Your ${plan.name} plan allows ${plan.limits.maxActiveDiscounts} active discount${plan.limits.maxActiveDiscounts === 1 ? '' : 's'}. Upgrade for unlimited.`,
      'BASIC',
    )
  }
  return null
}

export function assertCustomDomain(plan: PlanDefinition) {
  if (!plan.limits.customDomain) {
    return planError('Custom domains require the Basic plan or higher.', 'BASIC')
  }
  return null
}

export function assertCustomCode(plan: PlanDefinition) {
  if (!plan.limits.customCodeAllowed) {
    return planError('Custom CSS / HTML requires the Basic plan or higher.', 'BASIC')
  }
  return null
}

export function assertStorage(usedBytes: bigint, addBytes: number, plan: PlanDefinition) {
  if (plan.limits.maxStorageMB === -1) return null
  const limitBytes = BigInt(plan.limits.maxStorageMB) * BigInt(1024 * 1024)
  if (usedBytes + BigInt(addBytes) > limitBytes) {
    return planError(
      `Your ${plan.name} plan storage limit (${plan.limits.maxStorageMB} MB) is full. Upgrade for more.`,
      plan.id === 'FREE' ? 'BASIC' : 'PRO',
    )
  }
  return null
}

export function assertCOD(plan: PlanDefinition) {
  if (!plan.limits.codAllowed) {
    return planError('Cash on Delivery requires the Basic plan or higher.', 'BASIC')
  }
  return null
}
