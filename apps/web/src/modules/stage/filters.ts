import { z } from 'zod'

import { dateParam, textParam } from '@/shared/filters/schema'

/** Playbill filters. Unknown or malformed values fall back to "no filter". */
export const playbillSearchSchema = z
  .object({
    q: textParam.optional(),
    city: textParam.optional(),
    from: dateParam.optional(),
    to: dateParam.optional(),
  })
  .catch({})

export type PlaybillSearch = z.output<typeof playbillSearchSchema>

export const watchlistSearchSchema = z
  .object({
    q: textParam.optional(),
    status: z.enum(['watching', 'paused']).optional(),
  })
  .catch({})

export type WatchlistSearch = z.output<typeof watchlistSearchSchema>

export const playbillFilterKeys = [
  'q',
  'city',
  'from',
  'to',
] as const satisfies readonly (keyof PlaybillSearch)[]

export const watchlistFilterKeys = [
  'q',
  'status',
] as const satisfies readonly (keyof WatchlistSearch)[]
