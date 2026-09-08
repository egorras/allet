import { z } from 'zod'

import { textParam } from './schema'

/** "All" versus "with me" is a shared filter across modules (ALLET_PLAN.md §4). */
export const plansSearchSchema = z
  .object({
    q: textParam.optional(),
    participation: z.enum(['mine']).optional(),
  })
  .catch({})

export type PlansSearch = z.output<typeof plansSearchSchema>
