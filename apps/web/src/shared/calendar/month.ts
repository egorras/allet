/**
 * Month arithmetic on plain calendar dates. Day-level dates are never turned into
 * UTC midnight timestamps (ALLET_PLAN.md §4) — a month is just "YYYY-MM" and a day
 * is a local Date built from year/month/day.
 */
export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export interface Month {
  year: number
  /** 1-12. */
  month: number
}

export function parseMonth(value: string | undefined): Month | null {
  if (value === undefined || !MONTH_PATTERN.test(value)) return null
  const [year, month] = value.split('-').map(Number)
  if (year === undefined || month === undefined) return null
  return { year, month }
}

export function formatMonth({ year, month }: Month): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
}

export function currentMonth(today = new Date()): Month {
  return { year: today.getFullYear(), month: today.getMonth() + 1 }
}

export function addMonths({ year, month }: Month, delta: number): Month {
  const zeroBased = year * 12 + (month - 1) + delta
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 }
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** The six Monday-based weeks that cover the month, including leading/trailing days. */
export function monthGridDays({ year, month }: Month): Date[] {
  const first = new Date(year, month - 1, 1)
  const leading = (first.getDay() + 6) % 7
  const start = new Date(year, month - 1, 1 - leading)
  return Array.from(
    { length: 42 },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  )
}
