/**
 * Shared currency / number helpers.
 * Souqly prices are stored as plain numbers and displayed as Algerian Dinars
 * (DZD). We use the "DA" suffix because that's how prices are written on the
 * ground in Algeria and is more readable than "DZD 1,500.00" or the Arabic
 * "د.ج" glyph in mixed-locale text.
 */

export const CURRENCY_CODE = 'DZD'
export const CURRENCY_SYMBOL = 'DA'

/**
 * Format a numeric price as "1,500 DA". Decimals are dropped when they're .00
 * (rare in DZD where prices are whole-dinar) and shown to one place otherwise.
 */
export function formatPrice(
  value: number | string | null | undefined,
  opts: { fallback?: string; withCode?: boolean } = {},
): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return opts.fallback ?? `0 ${CURRENCY_SYMBOL}`
  const decimals = Number.isInteger(n) ? 0 : 2
  const formatted = n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  if (opts.withCode) return `${formatted} ${CURRENCY_CODE}`
  return `${formatted} ${CURRENCY_SYMBOL}`
}

/**
 * Compact form — useful for dashboards and stat cards where 12,500 DA wraps.
 * Renders e.g. "12.5K DA" / "1.2M DA".
 */
export function formatPriceCompact(
  value: number | string | null | undefined,
): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return `0 ${CURRENCY_SYMBOL}`
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ${CURRENCY_SYMBOL}`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K ${CURRENCY_SYMBOL}`
  return `${n.toLocaleString('en-US')} ${CURRENCY_SYMBOL}`
}
