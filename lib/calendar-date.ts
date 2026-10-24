/** Calendar date keys in the form `YYYY-MM-DD`, always interpreted in the **local** timezone. */

export function dateKeyToLocalDate(dateKey: string): Date {
  const parts = dateKey.split('-').map((p) => Number(p))
  const y = parts[0]
  const mo = parts[1]
  const d = parts[2]
  if (!y || !mo || !d || parts.length !== 3) {
    throw new Error(`Invalid date key: ${dateKey}`)
  }
  return new Date(y, mo - 1, d)
}

/**
 * Format a `YYYY-MM-DD` key for display without UTC parsing bugs.
 * (`new Date("2026-03-25")` is UTC midnight and can show as the previous calendar day.)
 */
export function formatDateKeyLocal(dateKey: string, locale: string, options?: Intl.DateTimeFormatOptions) {
  return dateKeyToLocalDate(dateKey).toLocaleDateString(locale, options)
}

/**
 * Safely parse a recorded date string (ISO timestamp or YYYY-MM-DD) into a local Date at 12:00 (noon)
 * to prevent any timezone offsets (e.g. UTC-6 Mexico City) from shifting the calendar date backwards.
 */
export function parseRecordedDate(dateStr: string): Date {
  if (!dateStr) return new Date()
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, y, m, d] = match
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0)
  }
  return new Date(dateStr)
}

/** Format a Date object to YYYY-MM-DD */
export function formatLocalDateYmd(date?: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Días enteros desde un instante ISO hasta ahora (misma lógica que el dashboard coach). */
export function diffWholeDaysFromNow(fromIso?: string | null, now = new Date()): number | null {
  if (!fromIso) return null
  const from = new Date(fromIso)
  if (Number.isNaN(from.getTime())) return null
  return Math.floor((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Returns a Date object representing "now" but in the specific timezone.
 * Useful for server-side calculations where process.env.TZ might be UTC.
 */
export function getNowInTimezone(timeZone: string): Date {
  const now = new Date()
  // Adjust the date string based on the timezone and parse it back to a Date object
  const tzString = now.toLocaleString('en-US', { timeZone })
  return new Date(tzString)
}

/** Útil para comparar `clients.membership_end` vs `payments.period_end`. */
export function isoTimestampsDifferMoreThanDays(
  a: string | null | undefined,
  b: string | null | undefined,
  thresholdDays = 1,
): boolean {
  if (!a?.trim() || !b?.trim()) return false
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  if (Number.isNaN(da) || Number.isNaN(db)) return false
  return Math.abs(da - db) > thresholdDays * 86400000
}
