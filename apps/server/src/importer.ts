import { createHash, randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import type { Database } from './db/client'
import { performances, productions, runs, sources, venues } from './db/schema'
import { deriveProductionUrlPath, parseMonth, sourceKeyForPath, ParseError } from './budapest/parse'
import { requestMonth, RequestError } from './requests'

const SOURCE = 'budapest-opera'
const idFor = (value: string) =>
  createHash('sha256').update(`${SOURCE}:${value}`).digest('hex').slice(0, 24)

export function programmeRecords(html: string, month: string) {
  const year = Number(month.slice(0, 4))
  const monthNumber = Number(month.slice(5))
  return parseMonth(html, year, monthNumber)
    .filter((event) => ['opera', 'eiffel'].includes(event.building))
    .map((event) => {
      if (!event.title || !event.venue || !event.performanceUrlPath.startsWith('/en/programme/'))
        throw new ParseError('Invalid programme event')
      const sourceUrl = new URL(event.performanceUrlPath, 'https://www.opera.hu').href
      if (new URL(sourceUrl).origin !== 'https://www.opera.hu')
        throw new ParseError('Unexpected programme host')
      const path = deriveProductionUrlPath(event.performanceUrlPath)
      const key = sourceKeyForPath(event.performanceUrlPath)
      const productionId = idFor(key.split('/').slice(0, -1).join('/'))
      // Ticket event IDs survive a changed date when the source retains the ticket
      // identity. Otherwise retain the source URL identity; never guess by title.
      let ticketIdentity: string | null = null
      if (event.ticketUrl) {
        const url = new URL(event.ticketUrl)
        if (
          url.protocol !== 'https:' ||
          !(url.hostname === 'jegy.hu' || url.hostname.endsWith('.jegy.hu'))
        )
          throw new ParseError('Unexpected ticket URL')
        ticketIdentity = /\/(\d+)\/?$/.exec(url.pathname)?.[1] ?? null
      }
      return {
        event,
        sourceUrl,
        productionId,
        productionUrl: new URL(path, 'https://www.opera.hu').href,
        id: idFor(ticketIdentity ? `ticket:${ticketIdentity}` : key),
        venueId: idFor(`venue:${event.building}:${event.venue}`),
      }
    })
}

export async function importMonth(
  database: Database,
  month: string,
  load: () => Promise<string> = () => requestMonth(database.client, month),
  now = () => new Date(),
) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error('Expected month YYYY-MM (2000–2099)')
  const startedAt = now().toISOString()
  const runId = randomUUID()
  // A one-request import has a 30s request deadline. An older lease cannot
  // publish afterwards: ownership is rechecked in the write transaction.
  await database.client.execute({
    sql: "UPDATE import_runs SET status = 'error', error_code = 'interrupted', finished_at = ? WHERE status = 'running' AND started_at < ?",
    args: [startedAt, new Date(now().getTime() - 300_000).toISOString()],
  })
  await database.db
    .insert(runs)
    .values({ id: runId, sourceKey: SOURCE, month, status: 'running', startedAt })
  let phase: 'request' | 'parse' | 'storage' = 'request'
  try {
    const html = await load()
    phase = 'parse'
    const records = programmeRecords(html, month)
    const observedAt = now().toISOString()
    phase = 'storage'
    await database.db.transaction(async (tx) => {
      const owned = await tx.select().from(runs).where(eq(runs.id, runId))
      if (owned[0]?.status !== 'running') throw new Error('Import lease expired')
      for (const record of records) {
        const { event } = record
        const venue = {
          id: record.venueId,
          name: event.venue,
          city: 'Budapest',
          timeZone: 'Europe/Budapest',
        }
        await tx.insert(venues).values(venue).onConflictDoUpdate({ target: venues.id, set: venue })
        const production = {
          id: record.productionId,
          sourceKey: SOURCE,
          title: event.title,
          composer: event.composer,
          sourceUrl: record.productionUrl,
        }
        await tx
          .insert(productions)
          .values(production)
          .onConflictDoUpdate({ target: productions.id, set: production })
        const performance = {
          id: record.id,
          productionId: record.productionId,
          venueId: record.venueId,
          date: event.startDate,
          time: event.startTime,
          sourceUrl: record.sourceUrl,
          ticketUrl: event.ticketUrl,
          observedAt,
        }
        await tx
          .insert(performances)
          .values(performance)
          .onConflictDoUpdate({ target: performances.id, set: performance })
      }
      // Missing events are not inferred to be cancelled or deleted.
      await tx.update(sources).set({ lastSuccessAt: observedAt }).where(eq(sources.key, SOURCE))
      await tx
        .update(runs)
        .set({ status: 'success', finishedAt: observedAt, count: records.length })
        .where(eq(runs.id, runId))
      await tx.run(
        sql`UPDATE request_gate SET failures = 0, paused_until = 0 WHERE service = 'opera.hu'`,
      )
    })
    // Only valid parsed pages clear a previous source failure. The slow spacing
    // remains in force after this single probe; no automatic catch-up runs.
    return { runId, count: records.length }
  } catch (error) {
    await database.db
      .update(runs)
      .set({
        status: 'error',
        finishedAt: now().toISOString(),
        errorCode:
          error instanceof ParseError ? 'parse' : error instanceof RequestError ? 'request' : phase,
      })
      .where(eq(runs.id, runId))
    throw error
  }
}
