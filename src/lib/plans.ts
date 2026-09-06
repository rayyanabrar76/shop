import type { Plan } from '@/generated/prisma/client'

export type PlanId = 'FREE' | 'BASIC' | 'PRO'

export interface PlanDefinition {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number // USD cents
  yearlyPrice: number  // USD cents (2 months free)
  stripePriceIdMonthlyEnv: string
  stripePriceIdYearlyEnv: string
  takeRatePercent: number    // e.g. 5 = 5%
  codFlatFeeCents: number    // per-COD-order surcharge ShopFlow keeps (0 if not allowed)
  limits: {
    maxProducts: number      // -1 = unlimited
    maxStorageMB: number     // -1 = unlimited
    customDomain: boolean
    removeBranding: boolean
    customCodeAllowed: boolean
    maxActiveDiscounts: number
    codAllowed: boolean
  }
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    description: 'Test the waters. Get a real storefront with the essentials.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    stripePriceIdMonthlyEnv: '',
    stripePriceIdYearlyEnv: '',
    takeRatePercent: 5,
    codFlatFeeCents: 0,
    limits: {
      maxProducts: 10,
      maxStorageMB: 500,
      customDomain: false,
      removeBranding: false,
      customCodeAllowed: false,
      maxActiveDiscounts: 1,
      codAllowed: false,
    },
  },
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    description: 'Everything you need for a real online store.',
    monthlyPrice: 1900,
    yearlyPrice: 19000, // 10 months
    stripePriceIdMonthlyEnv: 'STRIPE_PRICE_BASIC_MONTHLY',
    stripePriceIdYearlyEnv: 'STRIPE_PRICE_BASIC_YEARLY',
    takeRatePercent: 2,
    codFlatFeeCents: 20,
    limits: {
      maxProducts: -1,
      maxStorageMB: 5_000,
      customDomain: true,
      removeBranding: true,
      customCodeAllowed: true,
      maxActiveDiscounts: -1,
      codAllowed: true,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    description: 'For high-volume stores. Lower fees, more storage.',
    monthlyPrice: 4900,
    yearlyPrice: 49000,
    stripePriceIdMonthlyEnv: 'STRIPE_PRICE_PRO_MONTHLY',
    stripePriceIdYearlyEnv: 'STRIPE_PRICE_PRO_YEARLY',
    takeRatePercent: 0.5,
    codFlatFeeCents: 20,
    limits: {
      maxProducts: -1,
      maxStorageMB: 25_000,
      customDomain: true,
      removeBranding: true,
      customCodeAllowed: true,
      maxActiveDiscounts: -1,
      codAllowed: true,
    },
  },
}

export const TRIAL_DAYS = 14

/**
 * ShopFlow is free while it finds its first users, so there is nowhere to pay
 * and nothing may be gated behind a plan. The plan definitions above and the
 * subscription columns on Store are intentionally left in place — turning
 * billing back on means flipping this flag and restoring the /pricing and
 * /settings/billing routes, with no data migration.
 */
export const BILLING_ENABLED = false

/** What every store gets while billing is switched off: everything, no fees. */
const UNLIMITED: PlanDefinition = {
  id: 'PRO',
  name: 'Free',
  description: 'Everything unlocked while ShopFlow is free.',
  monthlyPrice: 0,
  yearlyPrice: 0,
  stripePriceIdMonthlyEnv: '',
  stripePriceIdYearlyEnv: '',
  takeRatePercent: 0,
  codFlatFeeCents: 0,
  limits: {
    maxProducts: -1,
    maxStorageMB: -1,
    customDomain: true,
    removeBranding: true,
    customCodeAllowed: true,
    maxActiveDiscounts: -1,
    codAllowed: true,
  },
}

export function getPlan(plan: Plan | PlanId): PlanDefinition {
  if (!BILLING_ENABLED) return UNLIMITED
  return PLANS[plan as PlanId] ?? PLANS.FREE
}

export function getActivePlan(store: {
  plan: Plan | PlanId
  subscriptionStatus: string | null
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
}): PlanDefinition {
  if (!BILLING_ENABLED) return UNLIMITED

  const planDef = getPlan(store.plan)
  if (planDef.id === 'FREE') return planDef

  const status = store.subscriptionStatus
  // Active or trialing → entitled
  if (status === 'active' || status === 'trialing') return planDef
  // Past-due gets grace period until currentPeriodEnd
  if (status === 'past_due' && store.currentPeriodEnd && store.currentPeriodEnd > new Date()) {
    return planDef
  }
  // Otherwise downgrade to FREE entitlements
  return PLANS.FREE
}

export function isUnlimited(value: number) {
  return value === -1
}

export function checkLimit(used: number, limit: number) {
  if (isUnlimited(limit)) return { ok: true, remaining: Infinity }
  return { ok: used < limit, remaining: Math.max(0, limit - used) }
}
