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
  /**
   * Currencies Stripe treats as having no minor unit (¥100 is 100, not 10000).
   * This mirrors Stripe's list exactly and drives the charge amount — it is NOT
   * a display choice. Do not set it to hide decimals; use displayDecimals.
   */
  zeroDecimal?: boolean
  /**
   * Overrides Intl's symbol. Under a fixed en-US locale, 20 of the currencies
   * below render as their bare code ("PKR 120.00"), which is not how anyone
   * writes a price locally.
   */
  symbol?: string
  /**
   * How many decimals to show. Purely presentational: PKR still settles in
   * paisa at Stripe, but nobody prices donuts as "Rs. 120.00".
   */
  displayDecimals?: number
}

/**
 * Currencies a merchant can pick. Kept to ones Stripe settles in, so the
 * storefront and the actual charge can never disagree.
 */
export const CURRENCIES: CurrencyDefinition[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs.', displayDecimals: 0 },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', displayDecimals: 0 },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs.' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
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

/**
 * How many decimals to show for this currency. Presentation only — never use
 * this to derive a Stripe amount; that is toStripeAmount()'s job.
 */
export function currencyDecimals(currency: string | null | undefined): number {
  const def = getCurrency(currency)
  if (def.displayDecimals !== undefined) return def.displayDecimals
  return def.zeroDecimal ? 0 : 2
}

/**
 * Decimals to actually render for one amount. A currency set to 0 decimals can
 * still hold a fractional value — a price entered before the setting existed,
 * or an imported one. Showing "Rs. 121" while Stripe charges 120.50 would be a
 * lie, so an amount that is not a whole unit keeps its decimals.
 */
function decimalsFor(amount: number, currency: string | null | undefined): number {
  const preferred = currencyDecimals(currency)
  if (preferred === 0 && Math.round(Number(amount) || 0) % 100 !== 0) return 2
  return preferred
}

/** Format a stored integer amount for display, e.g. 1999 -> "$19.99", 12000 PKR -> "Rs. 120". */
export function formatPrice(amount: number, currency: string | null | undefined): string {
  const def = getCurrency(currency)
  const value = (Number(amount) || 0) / 100
  const decimals = decimalsFor(amount, currency)
  try {
    const parts = new Intl.NumberFormat(BASE_LOCALE, {
      style: 'currency',
      currency: def.code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).formatToParts(value)
    // Swap Intl's symbol for our override while keeping its placement and
    // spacing, which differ per currency.
    return parts
      .map(p => (p.type === 'currency' && def.symbol ? def.symbol : p.value))
      .join('')
  } catch {
    // Unknown code slipped through — never blow up a product page over money
    // formatting.
    return `${def.symbol ?? def.code} ${value.toFixed(decimals)}`
  }
}

/** The bare symbol ("$", "Rs.", "€") for input prefixes and tight table cells. */
export function currencySymbol(currency: string | null | undefined): string {
  const def = getCurrency(currency)
  if (def.symbol) return def.symbol
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

/**
 * Stored integer -> the value a price input should show, e.g. 114 -> "1.14".
 * Pairs with inputToAmount(); both forms edit prices in whole currency units
 * rather than making the merchant think in minor units.
 */
export function amountToInput(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return ''
  const value = Number(amount) / 100
  // decimalsFor, not currencyDecimals: opening and saving a product must never
  // round an existing fractional price away.
  return value.toFixed(decimalsFor(Number(amount), currency))
}

/**
 * Price input -> stored integer, e.g. "1.14" -> 114. Rounding absorbs binary
 * float error (1.14 * 100 is 114.00000000000001), so a round-trip through the
 * form never shifts a price by a minor unit.
 */
/**
 * Groups the whole part of a half-typed amount: 12000 reads as 12,000.
 *
 * Display only. What is held in state and sent to the server stays plain
 * digits, because inputToAmount runs parseFloat and parseFloat stops dead at
 * a comma: let a grouped string reach it and a twelve thousand rupee donut
 * quietly becomes a twelve rupee one.
 *
 * Written by hand rather than through Intl because this runs on a value
 * somebody is still typing. Intl would turn a trailing "12." into "12" and
 * eat the decimal point out from under the caret.
 */
export function groupAmountInput(input: string): string {
  if (!input) return ''
  const dot = input.indexOf('.')
  const whole = dot === -1 ? input : input.slice(0, dot)
  const rest = dot === -1 ? '' : input.slice(dot)
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + rest
}

/** Strips a typed amount back to digits and at most one decimal point. */
export function cleanAmountInput(input: string, wholeNumbersOnly: boolean): string {
  const digits = input.replace(wholeNumbersOnly ? /[^0-9]/g : /[^0-9.]/g, '')
  if (wholeNumbersOnly) return digits
  const dot = digits.indexOf('.')
  return dot === -1 ? digits : digits.slice(0, dot + 1) + digits.slice(dot + 1).replace(/\./g, '')
}

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
