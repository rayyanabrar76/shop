/**
 * Store currency.
 *
 * Money is stored as an integer throughout the schema (Product.price,
 * Order.total, DiscountCode.value, ShippingRate.price, ...). The invariant is:
 *
 *     stored value / 100  =  the human-readable amount in the store's currency
 *
 * That holds for every currency, including zero-decimal ones like JPY — ¥1,000
 * is stored as 100000. Keeping one rule everywhere means adding currency
 * support required no data migration and no change to how prices are stored.
 * The only place the distinction matters is Stripe, which wants the amount in
 * the currency's smallest unit — see toStripeAmount().
 */

export interface CurrencyDefinition {
  code: string
  name: string
  /** Currencies Stripe treats as having no minor unit (¥100 is 100, not 10000). */
  zeroDecimal?: boolean
}

/**
 * Currencies a merchant can pick. Kept to ones Stripe settles in, so the
 * storefront and the actual charge can never disagree.
 */
export const CURRENCIES: CurrencyDefinition[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'LKR', name: 'Sri Lankan Rupee' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'JPY', name: 'Japanese Yen', zeroDecimal: true },
  { code: 'KRW', name: 'South Korean Won', zeroDecimal: true },
  { code: 'VND', name: 'Vietnamese Dong', zeroDecimal: true },
]

export const DEFAULT_CURRENCY = 'USD'

const BY_CODE = new Map(CURRENCIES.map(c => [c.code, c]))

export function isSupportedCurrency(code: string): boolean {
  return BY_CODE.has(code?.toUpperCase?.() ?? '')
}

export function getCurrency(code: string | null | undefined): CurrencyDefinition {
  return BY_CODE.get((code ?? '').toUpperCase()) ?? BY_CODE.get(DEFAULT_CURRENCY)!
}

/**
 * A fixed base locale is deliberate. Formatting with the *viewer's* locale
 * would produce different output on the server than in the browser and trip
 * React hydration mismatches; the currency itself still selects the correct
 * symbol, placement and decimal count.
 */
const BASE_LOCALE = 'en-US'

/** Format a stored integer amount for display, e.g. 1999 -> "$19.99" / "PKR 19.99". */
export function formatPrice(amount: number, currency: string | null | undefined): string {
  const def = getCurrency(currency)
  const value = (Number(amount) || 0) / 100
  try {
    return new Intl.NumberFormat(BASE_LOCALE, {
      style: 'currency',
      currency: def.code,
      ...(def.zeroDecimal
        ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    }).format(value)
  } catch {
    // Unknown code slipped through — never blow up a product page over money
    // formatting.
    return `${def.code} ${value.toFixed(def.zeroDecimal ? 0 : 2)}`
  }
}

/** The bare symbol ("$", "₨", "€") for input prefixes and tight table cells. */
export function currencySymbol(currency: string | null | undefined): string {
  const def = getCurrency(currency)
  try {
    const parts = new Intl.NumberFormat(BASE_LOCALE, {
      style: 'currency',
      currency: def.code,
    }).formatToParts(0)
    return parts.find(p => p.type === 'currency')?.value ?? def.code
  } catch {
    return def.code
  }
}

/** How many decimal places a price input should accept for this currency. */
export function currencyDecimals(currency: string | null | undefined): number {
  return getCurrency(currency).zeroDecimal ? 0 : 2
}

/**
 * Stored integer -> the value a price input should show, e.g. 114 -> "1.14".
 * Pairs with inputToAmount(); both forms edit prices in whole currency units
 * rather than making the merchant think in minor units.
 */
export function amountToInput(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return ''
  const value = Number(amount) / 100
  return value.toFixed(currencyDecimals(currency))
}

/**
 * Price input -> stored integer, e.g. "1.14" -> 114. Rounding absorbs binary
 * float error (1.14 * 100 is 114.00000000000001), so a round-trip through the
 * form never shifts a price by a minor unit.
 */
export function inputToAmount(input: string | number): number {
  const value = typeof input === 'number' ? input : parseFloat(input)
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100)
}

/**
 * Convert a stored amount to the integer Stripe expects. Stripe wants the
 * smallest currency unit: cents for USD (our stored value as-is), but whole yen
 * for JPY — passing 100000 there would charge ¥100,000 instead of ¥1,000.
 */
export function toStripeAmount(amount: number, currency: string | null | undefined): number {
  const def = getCurrency(currency)
  const value = Math.round(Number(amount) || 0)
  return def.zeroDecimal ? Math.round(value / 100) : value
}
