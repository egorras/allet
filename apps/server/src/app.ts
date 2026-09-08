import { Hono } from 'hono'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { scheduleInputSchema, taskInputSchema } from '@allet/contracts'
import type { Database } from './db/client'
import {
  performances,
  productions,
  venues,
  sources,
  runs,
  runLog,
  schedules,
  tasks,
} from './db/schema'
import { requestMonthSync } from './scheduler'

/**
 * There is no authentication yet, and the server listens on loopback only, so
 * a page in the user's own browser is the one thing that could still reach it.
 * A custom header cannot be set cross-origin without a preflight, and no
 * preflight is ever answered here, so such a request is refused before it is
 * sent. This is a stopgap: it is replaced by real household accounts, not
 * extended.
 */
const LOCAL_HEADER = 'x-allet-local'

export function createApp({ db, client }: Database) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store')
    c.header('X-Content-Type-Options', 'nosniff')
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      if (c.req.header(LOCAL_HEADER) !== '1') return c.json({ error: 'forbidden' }, 403)
      if (!c.req.header('content-type')?.startsWith('application/json'))
        return c.json({ error: 'unsupported_media_type' }, 415)
    }
    await next()
  })
  app.get('/api/health', (c) => c.json({ status: 'ok' }))
  const catalogue = () =>
    db
      .select({
        id: performances.id,
        productionId: productions.id,
        title: productions.title,
        composer: productions.composer,
        date: performances.date,
        time: performances.time,
        timeZone: venues.timeZone,
        venue: venues.name,
        city: venues.city,
        sourceUrl: performances.sourceUrl,
        ticketUrl: performances.ticketUrl,
        observedAt: performances.observedAt,
      })
      .from(performances)
      .innerJoin(productions, eq(productions.id, performances.productionId))
      .innerJoin(venues, eq(venues.id, performances.venueId))
      .orderBy(asc(performances.date), asc(performances.time), asc(performances.id))
  app.get('/api/performances', async (c) => c.json({ performances: await catalogue() }))
  app.get('/api/productions/:id', async (c) => {
    const [production] = await db
      .select()
      .from(productions)
      .where(eq(productions.id, c.req.param('id')))
    if (!production) return c.json({ error: 'not_found' }, 404)
    return c.json({
      ...production,
      performances: await catalogue().where(eq(productions.id, production.id)),
    })
  })

  const sourceOr404 = async (key: string) =>
    (await db.select().from(sources).where(eq(sources.key, key)))[0]

  app.get('/api/sources', async (c) => {
    const all = await db.select().from(sources)
    const recent = await db.select().from(runs).orderBy(desc(runs.startedAt)).limit(20)
    const allSchedules = await db.select().from(schedules)
    const allTasks = await db.select().from(tasks).orderBy(asc(tasks.month))
    const lines = recent.length
      ? await db
          .select()
          .from(runLog)
          .where(
            inArray(
              runLog.runId,
              recent.map((run) => run.id),
            ),
          )
          .orderBy(asc(runLog.id))
      : []
    return c.json({
      sources: all.map((source) => ({
        ...source,
        schedule: allSchedules.find((schedule) => schedule.sourceKey === source.key) ?? null,
        tasks: allTasks.filter((task) => task.sourceKey === source.key),
        runs: recent
          .filter((run) => run.sourceKey === source.key)
          .map((run) => ({
            ...run,
            log: lines
              .filter((line) => line.runId === run.id)
              .map((line) => ({
                at: line.at,
                code: line.code,
                detail: JSON.parse(line.detail) as Record<string, string | number>,
              })),
          })),
      })),
    })
  })

  // Changing the schedule spends nothing: the worker reads it on its next tick.
  app.put('/api/sources/:key/schedule', async (c) => {
    const key = c.req.param('key')
    if (!(await sourceOr404(key))) return c.json({ error: 'not_found' }, 404)
    const input = scheduleInputSchema.safeParse(await c.req.json())
    if (!input.success) return c.json({ error: 'invalid' }, 400)
    await db.update(schedules).set(input.data).where(eq(schedules.sourceKey, key))
    return c.json({ status: 'ok' })
  })

  /**
   * Queues a month, or brings one already queued forward. The request is not
   * made here: this process never reaches the source. The worker picks the
   * month up on its next tick, if the shared budget allows it.
   */
  app.post('/api/sources/:key/tasks', async (c) => {
    const key = c.req.param('key')
    if (!(await sourceOr404(key))) return c.json({ error: 'not_found' }, 404)
    const input = taskInputSchema.safeParse(await c.req.json())
    if (!input.success) return c.json({ error: 'invalid' }, 400)
    await requestMonthSync({ db, client }, key, input.data.month, new Date())
    return c.json({ status: 'ok' })
  })

  app.delete('/api/sources/:key/tasks/:month', async (c) => {
    const key = c.req.param('key')
    if (!(await sourceOr404(key))) return c.json({ error: 'not_found' }, 404)
    await db
      .delete(tasks)
      .where(and(eq(tasks.sourceKey, key), eq(tasks.month, c.req.param('month'))))
    return c.json({ status: 'ok' })
  })

  app.onError((error, c) => {
    console.error(error)
    return c.json({ error: 'internal_error' }, 500)
  })
  return app
}
