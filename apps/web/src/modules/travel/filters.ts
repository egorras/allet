import { z } from 'zod'

import { dateParam, textParam } from '@/shared/filters/schema'

export const offersSearchSchema = z
  .object({
    q: textParam.optional(),
    from: dateParam.optional(),
    to: dateParam.optional(),
  })
  .catch({})

export type OffersSearch = z.output<typeof offersSearchSchema>
