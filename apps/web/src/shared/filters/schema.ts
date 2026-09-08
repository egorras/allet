import { z } from 'zod'

/** A day-level date, not a timestamp (ALLET_PLAN.md §4). */
export const dateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const textParam = z.string().min(1)

/**
 * A filter is "active" when it is present in the address. Cleared controls drop their
 * parameter instead of storing an empty value, so the URL stays readable.
 */
export function countActiveFilters(search: Record<string, unknown>): number {
  return Object.values(search).filter((value) => value !== undefined && value !== '').length
}

export function optionalValue(value: string): string | undefined {
  return value === '' ? undefined : value
}
