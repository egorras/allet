import { z } from 'zod'

/** A day-level date, not a timestamp (ALLET_PLAN.md §4). */
export const dateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const textParam = z.string().min(1)

/**
 * A filter is "active" when its own parameter is present in the address. Only the keys a
 * list actually filters by are counted: the router hands a route every search parameter
 * in the URL, including ones no schema knows and values it rejected as malformed.
 */
export function countActiveFilters(
  search: Record<string, unknown>,
  keys: readonly string[],
): number {
  return keys.filter((key) => {
    const value = search[key]
    return value !== undefined && value !== ''
  }).length
}

export function optionalValue(value: string): string | undefined {
  return value === '' ? undefined : value
}
