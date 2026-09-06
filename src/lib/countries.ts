/**
 * Countries a shop can trade from.
 *
 * Deliberately not the full ISO 3166 list: this drives a picker a merchant
 * scrolls once, and the sample city is there so checkout can show a plausible
 * local example instead of "New York" to a shop selling in rupees.
 */

export interface Country {
  code: string
  name: string
  /** A recognisable city, used as the placeholder in address fields. */
  sampleCity: string
}

export const COUNTRIES: Country[] = [
  { code: 'PK', name: 'Pakistan',              sampleCity: 'Karachi' },
  { code: 'IN', name: 'India',                 sampleCity: 'Mumbai' },
  { code: 'BD', name: 'Bangladesh',            sampleCity: 'Dhaka' },
  { code: 'AE', name: 'United Arab Emirates',  sampleCity: 'Dubai' },
  { code: 'SA', name: 'Saudi Arabia',          sampleCity: 'Riyadh' },
  { code: 'GB', name: 'United Kingdom',        sampleCity: 'London' },
  { code: 'US', name: 'United States',         sampleCity: 'New York' },
  { code: 'CA', name: 'Canada',                sampleCity: 'Toronto' },
  { code: 'AU', name: 'Australia',             sampleCity: 'Sydney' },
  { code: 'NZ', name: 'New Zealand',           sampleCity: 'Auckland' },
  { code: 'IE', name: 'Ireland',               sampleCity: 'Dublin' },
  { code: 'DE', name: 'Germany',               sampleCity: 'Berlin' },
  { code: 'FR', name: 'France',                sampleCity: 'Paris' },
  { code: 'ES', name: 'Spain',                 sampleCity: 'Madrid' },
  { code: 'IT', name: 'Italy',                 sampleCity: 'Milan' },
  { code: 'NL', name: 'Netherlands',           sampleCity: 'Amsterdam' },
  { code: 'SE', name: 'Sweden',                sampleCity: 'Stockholm' },
  { code: 'PL', name: 'Poland',                sampleCity: 'Warsaw' },
  { code: 'TR', name: 'Türkiye',               sampleCity: 'Istanbul' },
  { code: 'EG', name: 'Egypt',                 sampleCity: 'Cairo' },
  { code: 'NG', name: 'Nigeria',               sampleCity: 'Lagos' },
  { code: 'KE', name: 'Kenya',                 sampleCity: 'Nairobi' },
  { code: 'ZA', name: 'South Africa',          sampleCity: 'Cape Town' },
  { code: 'BR', name: 'Brazil',                sampleCity: 'São Paulo' },
  { code: 'MX', name: 'Mexico',                sampleCity: 'Mexico City' },
  { code: 'ID', name: 'Indonesia',             sampleCity: 'Jakarta' },
  { code: 'MY', name: 'Malaysia',              sampleCity: 'Kuala Lumpur' },
  { code: 'SG', name: 'Singapore',             sampleCity: 'Singapore' },
  { code: 'PH', name: 'Philippines',           sampleCity: 'Manila' },
  { code: 'JP', name: 'Japan',                 sampleCity: 'Tokyo' },
]

export function getCountry(code: string | null | undefined): Country | null {
  if (!code) return null
  return COUNTRIES.find(c => c.code === code.toUpperCase()) ?? null
}

export function isSupportedCountry(code: string): boolean {
  return COUNTRIES.some(c => c.code === code.toUpperCase())
}

/**
 * What the address fields should suggest. Falls back to the American examples
 * only when the shop has not said where it trades from.
 */
export function addressPlaceholders(code: string | null | undefined) {
  const country = getCountry(code)
  return {
    city: country?.sampleCity ?? 'New York',
    country: country?.name ?? 'United States',
  }
}
