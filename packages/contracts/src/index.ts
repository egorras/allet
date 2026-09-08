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
export const monthSchema = z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM')
/** Bounds are the same ones the database enforces, so the two cannot drift. */
export const scheduleInputSchema = z.object({
  enabled: z.boolean(),
  windowMonths: z.number().int().min(1).max(12),
  intervalMinutes: z.number().int().min(60).max(43_200),
})
export const taskInputSchema = z.object({ month: monthSchema })
export const runLogLineSchema = z.object({
  at: z.string(),
  code: z.enum(['started', 'fetched', 'parsed', 'stored', 'failed']),
  detail: z.record(z.string(), z.union([z.string(), z.number()])),
})
export const taskSchema = z.object({
  month: monthSchema,
  origin: z.enum(['window', 'request']),
  dueAt: z.string(),
  lastRunAt: z.string().nullable(),
  lastStatus: z.enum(['success', 'error', 'deferred']).nullable(),
  failures: z.number(),
})
export const sourcesSchema = z.object({
  sources: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      url: z.url(),
      lastSuccessAt: z.string().nullable(),
      schedule: scheduleInputSchema.nullable(),
      tasks: z.array(taskSchema),
      runs: z.array(
        z.object({
          id: z.string(),
          month: z.string(),
          status: z.enum(['running', 'success', 'error']),
          startedAt: z.string(),
          finishedAt: z.string().nullable(),
          count: z.number().nullable(),
          errorCode: z.enum(['request', 'parse', 'interrupted', 'storage']).nullable(),
          trigger: z.enum(['manual', 'scheduled']),
          log: z.array(runLogLineSchema),
        }),
      ),
    }),
  ),
})
export type Sources = z.infer<typeof sourcesSchema>
export type ScheduleInput = z.infer<typeof scheduleInputSchema>
export type Performance = z.infer<typeof performanceSchema>
