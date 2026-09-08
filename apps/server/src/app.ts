import { Hono } from 'hono'
import { asc, desc, eq } from 'drizzle-orm'
import type { Database } from './db/client'
import { performances, productions, venues, sources, runs } from './db/schema'

export function createApp({ db }: Database) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store')
    c.header('X-Content-Type-Options', 'nosniff')
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
  app.get('/api/sources', async (c) => {
    const all = await db.select().from(sources)
    const recent = await db.select().from(runs).orderBy(desc(runs.startedAt)).limit(20)
    return c.json({
      sources: all.map((source) => ({
        ...source,
        runs: recent.filter((run) => run.sourceKey === source.key),
      })),
    })
  })
  app.onError((error, c) => {
    console.error(error)
    return c.json({ error: 'internal_error' }, 500)
  })
  return app
}
