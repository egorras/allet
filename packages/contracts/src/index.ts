import { z } from 'zod'

export const performanceSchema = z.object({
  id: z.string(),
  productionId: z.string(),
  title: z.string(),
  composer: z.string().nullable(),
  date: z.string(),
  time: z.string(),
  timeZone: z.string(),
  venue: z.string(),
  city: z.string(),
  sourceUrl: z.url(),
  ticketUrl: z.url().nullable(),
  observedAt: z.string(),
})
export const catalogueSchema = z.object({ performances: z.array(performanceSchema) })
export const productionSchema = z.object({
  id: z.string(),
  title: z.string(),
  composer: z.string().nullable(),
  sourceUrl: z.url(),
  performances: z.array(performanceSchema),
})
export const sourcesSchema = z.object({
  sources: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      url: z.url(),
      lastSuccessAt: z.string().nullable(),
      runs: z.array(
        z.object({
          id: z.string(),
          month: z.string(),
          status: z.enum(['running', 'success', 'error']),
          startedAt: z.string(),
          finishedAt: z.string().nullable(),
          count: z.number().nullable(),
          errorCode: z.enum(['request', 'parse', 'interrupted', 'storage']).nullable(),
        }),
      ),
    }),
  ),
})
export type Performance = z.infer<typeof performanceSchema>
