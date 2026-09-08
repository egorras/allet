import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { sourcesSchema } from '@allet/contracts'
import { openDatabase, type Database } from '../src/db/client'
import { createApp } from '../src/app'
import { importMonth } from '../src/importer'
import { runs, schedules, tasks } from '../src/db/schema'
import {
  failureBackoff,
  reconcileWindow,
  requestMonthSync,
  runTick,
  spread,
  windowFor,
} from '../src/scheduler'

const SOURCE = 'budapest-opera'
const fixture = readFileSync(
  new URL('../src/budapest/fixtures/programme_month_2026-10.html', import.meta.url),
  'utf8',
)
const opened: Database[] = []
async function open(enabled = true) {
  const database = await openDatabase(':memory:')
  opened.push(database)
  if (enabled)
    await database.db
      .update(schedules)
      .set({ enabled: true })
      .where(eq(schedules.sourceKey, SOURCE))
  return database
}
afterEach(() => {
  for (const database of opened.splice(0)) database.client.close()
})
const at = (value: string) => () => new Date(value)
const load = () => Promise.resolve(fixture)

describe('rolling window', () => {
  it('covers the current month first and adds months as time moves', () => {
    expect(windowFor(new Date('2026-11-20T00:00:00Z'), 3)).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
    ])
    expect(windowFor(new Date('2026-12-31T23:00:00Z'), 2)).toEqual(['2026-12', '2027-01'])
  })

  it('adds months that enter the window and drops ones that leave, keeping requested months', async () => {
    const database = await open()
    await reconcileWindow(database, SOURCE, new Date('2026-10-05T00:00:00Z'))
    expect((await database.db.select().from(tasks)).map((task) => task.month)).toEqual([
      '2026-10',
      '2026-11',
      '2026-12',
    ])
    await requestMonthSync(database, SOURCE, '2027-06', new Date('2026-10-05T00:00:00Z'))
    await reconcileWindow(database, SOURCE, new Date('2026-11-05T00:00:00Z'))
    const months = (await database.db.select().from(tasks)).map((task) => task.month).sort()
    expect(months).toEqual(['2026-11', '2026-12', '2027-01', '2027-06'])
  })

  it('spreads months deterministically within one interval', () => {
    expect(spread('2026-10', 86_400_000)).toBe(spread('2026-10', 86_400_000))
    expect(spread('2026-10', 86_400_000)).not.toBe(spread('2026-11', 86_400_000))
    expect(spread('2026-10', 86_400_000)).toBeLessThan(86_400_000)
  })

  it('backs a repeatedly failing month off, up to a week', () => {
    expect(failureBackoff(1, 1440)).toBe(2 * 1440 * 60_000)
    expect(failureBackoff(20, 1440)).toBe(7 * 24 * 60 * 60_000)
  })
})

describe('tick', () => {
  it('does nothing at all while the schedule is off', async () => {
    const database = await open(false)
    expect(await runTick(database, SOURCE, at('2026-10-05T00:00:00Z'), load)).toEqual({
      status: 'disabled',
    })
    expect(await database.db.select().from(tasks)).toHaveLength(0)
    expect(await database.db.select().from(runs)).toHaveLength(0)
  })

  it('imports one month per tick and records the run as scheduled', async () => {
    const database = await open()
    const first = await runTick(database, SOURCE, at('2026-10-05T00:00:00Z'), load)
    expect(first).toEqual({ status: 'imported', month: '2026-10' })
    const [run] = await database.db.select().from(runs)
    expect(run).toMatchObject({ trigger: 'scheduled', status: 'success', month: '2026-10' })
  })

  it('coalesces an idle gap into a single run instead of one per missed interval', async () => {
    const database = await open()
    await database.db.update(schedules).set({ windowMonths: 1 })
    await runTick(database, SOURCE, at('2026-10-05T00:00:00Z'), load)
    // Ten idle days. The month is due once, one run satisfies it, and the next
    // due time is measured from this run rather than from the ten missed ones.
    expect(await runTick(database, SOURCE, at('2026-10-15T00:00:00Z'), load)).toMatchObject({
      status: 'imported',
      month: '2026-10',
    })
    expect(await runTick(database, SOURCE, at('2026-10-15T00:00:01Z'), load)).toEqual({
      status: 'idle',
    })
    const [task] = await database.db.select().from(tasks).where(eq(tasks.month, '2026-10'))
    expect(task?.dueAt.slice(0, 10)).toBe('2026-10-16')
    expect(await database.db.select().from(runs)).toHaveLength(2)
  })

  it('runs a requested month before window work and drops it once fulfilled', async () => {
    const database = await open()
    await reconcileWindow(database, SOURCE, new Date('2026-10-05T00:00:00Z'))
    await requestMonthSync(database, SOURCE, '2027-05', new Date('2026-10-05T00:00:00Z'))
    expect(await runTick(database, SOURCE, at('2026-10-05T00:01:00Z'), load)).toMatchObject({
      month: '2027-05',
    })
    await reconcileWindow(database, SOURCE, new Date('2026-10-05T00:02:00Z'))
    expect((await database.db.select().from(tasks)).map((task) => task.month)).not.toContain(
      '2027-05',
    )
  })

  it('defers without recording a failed import when the budget is spent', async () => {
    const database = await open()
    await database.client.execute({
      sql: "INSERT INTO request_gate(service, paused_until) VALUES ('opera.hu', ?)",
      args: [Date.parse('2026-10-06T00:00:00Z')],
    })
    const result = await runTick(database, SOURCE, at('2026-10-05T00:00:00Z'), load)
    expect(result.status).toBe('deferred')
    expect(await database.db.select().from(runs)).toHaveLength(0)
    const [task] = await database.db.select().from(tasks).where(eq(tasks.month, '2026-10'))
    expect(task?.lastStatus).toBe('deferred')
    expect(task?.failures).toBe(0)
  })

  it('backs a failing month off and moves to the next one, keeping the failure counted', async () => {
    const database = await open()
    const failing = () => Promise.reject(new Error('boom'))
    const first = await runTick(database, SOURCE, at('2026-10-05T00:00:00Z'), failing)
    expect(first).toMatchObject({ status: 'failed', month: '2026-10' })
    const [task] = await database.db.select().from(tasks).where(eq(tasks.month, '2026-10'))
    expect(task).toMatchObject({ failures: 1, lastStatus: 'error' })
    expect(await runTick(database, SOURCE, at('2026-10-05T00:01:00Z'), load)).toMatchObject({
      month: '2026-11',
    })
  })

  it('yields to an import already in flight rather than counting it as a failure', async () => {
    const database = await open()
    await database.db.insert(runs).values({
      id: 'in-flight',
      sourceKey: SOURCE,
      month: '2026-10',
      status: 'running',
      startedAt: '2026-10-05T00:00:00Z',
    })
    expect(await runTick(database, SOURCE, at('2026-10-05T00:01:00Z'), load)).toEqual({
      status: 'idle',
    })
    const [task] = await database.db.select().from(tasks).where(eq(tasks.month, '2026-10'))
    expect(task?.failures).toBe(0)
  })
})

describe('run log and schedule API', () => {
  it('reports what each run actually did, and counts a repeat import as unchanged', async () => {
    const database = await open()
    await importMonth(database, '2026-10', load)
    const repeat = await importMonth(database, '2026-10', load)
    expect(repeat.created).toBe(0)
    expect(repeat.unchanged).toBe(repeat.count)
    const app = createApp(database)
    const body = sourcesSchema.parse(await (await app.request('/api/sources')).json())
    const source = body.sources[0]
    expect(source?.runs[0]?.log.map((line) => line.code)).toEqual([
      'started',
      'fetched',
      'parsed',
      'stored',
    ])
    expect(source?.runs[0]?.log.at(-1)?.detail).toMatchObject({ created: 0 })
    expect(source?.schedule).toMatchObject({ enabled: true, windowMonths: 3 })
  })

  it('changes the schedule and queues a month without making any request', async () => {
    const database = await open(false)
    const app = createApp(database)
    const headers = { 'x-allet-local': '1', 'content-type': 'application/json' }
    expect(
      (
        await app.request('/api/sources/budapest-opera/schedule', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ enabled: true, windowMonths: 2, intervalMinutes: 720 }),
        })
      ).status,
    ).toBe(200)
    const [schedule] = await database.db.select().from(schedules)
    expect(schedule).toMatchObject({ enabled: true, windowMonths: 2, intervalMinutes: 720 })
    expect(
      (
        await app.request('/api/sources/budapest-opera/tasks', {
          method: 'POST',
          headers,
          body: JSON.stringify({ month: '2027-03' }),
        })
      ).status,
    ).toBe(200)
    expect((await database.db.select().from(tasks))[0]).toMatchObject({
      month: '2027-03',
      origin: 'request',
    })
    expect(await database.db.select().from(runs)).toHaveLength(0)
    expect(
      (
        await app.request('/api/sources/budapest-opera/tasks/2027-03', {
          method: 'DELETE',
          headers,
        })
      ).status,
    ).toBe(200)
    expect(await database.db.select().from(tasks)).toHaveLength(0)
  })

  it('refuses a write that a cross-origin page could make, and rejects invalid input', async () => {
    const database = await open(false)
    const app = createApp(database)
    const body = JSON.stringify({ enabled: true, windowMonths: 2, intervalMinutes: 720 })
    // No custom header: exactly what a form post or a simple cross-origin
    // fetch can send without a preflight.
    expect(
      (
        await app.request('/api/sources/budapest-opera/schedule', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body,
        })
      ).status,
    ).toBe(403)
    expect(
      (
        await app.request('/api/sources/budapest-opera/schedule', {
          method: 'PUT',
          headers: { 'x-allet-local': '1', 'content-type': 'text/plain' },
          body,
        })
      ).status,
    ).toBe(415)
    const headers = { 'x-allet-local': '1', 'content-type': 'application/json' }
    expect(
      (
        await app.request('/api/sources/budapest-opera/schedule', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ enabled: true, windowMonths: 99, intervalMinutes: 720 }),
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await app.request('/api/sources/budapest-opera/tasks', {
          method: 'POST',
          headers,
          body: JSON.stringify({ month: 'whenever' }),
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await app.request('/api/sources/nope/tasks', {
          method: 'POST',
          headers,
          body: JSON.stringify({ month: '2027-03' }),
        })
      ).status,
    ).toBe(404)
    expect(await database.db.select().from(schedules).where(eq(schedules.enabled, true))).toEqual(
      [],
    )
  })
})
