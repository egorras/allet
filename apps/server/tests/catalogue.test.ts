import { mkdtempSync, readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { catalogueSchema, productionSchema, sourcesSchema } from '@allet/contracts'
import { openDatabase, type Database } from '../src/db/client'
import { importMonth } from '../src/importer'
import { createApp } from '../src/app'
import { performances, runs } from '../src/db/schema'
import { policy, requestMonth, reserveRequest, retryAfter } from '../src/requests'

const fixture = readFileSync(
  new URL('../src/budapest/fixtures/programme_month_2026-10.html', import.meta.url),
  'utf8',
)
const databases: Database[] = []
const directories: string[] = []
async function open(path = ':memory:') {
  const db = await openDatabase(path)
  databases.push(db)
  return db
}
afterEach(async () => {
  for (const database of databases.splice(0)) database.client.close()
  for (const path of directories.splice(0))
    await rm(path, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
})

describe('catalogue import and API', () => {
  it('migrates, imports, deduplicates and serves validated records after reopening', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'allet-test-'))
    directories.push(directory)
    const path = join(directory, 'test.db')
    const database = await open(path)
    const result = await importMonth(database, '2026-10', () => Promise.resolve(fixture))
    expect(result.count).toBeGreaterThan(0)
    await importMonth(database, '2026-10', () => Promise.resolve(fixture))
    const rows = await database.db.select().from(performances)
    expect(rows).toHaveLength(result.count)
    database.client.close()
    const reopened = await open(path)
    const app = createApp(reopened)
    const catalogue = catalogueSchema.parse(await (await app.request('/api/performances')).json())
    expect(catalogue.performances).toHaveLength(result.count)
    expect(catalogue.performances[0]).toMatchObject({
      date: '2026-10-01',
      time: '20:00',
      timeZone: 'Europe/Budapest',
    })
    const first = catalogue.performances[0]
    if (!first) throw new Error('Missing imported performance')
    const production = productionSchema.parse(
      await (await app.request(`/api/productions/${first.productionId}`)).json(),
    )
    expect(production.performances[0]?.id).toBe(first.id)
    const sources = sourcesSchema.parse(await (await app.request('/api/sources')).json())
    expect(sources.sources[0]?.runs).toHaveLength(2)
    expect((await app.request('/api/productions/missing')).status).toBe(404)
    expect(
      (await app.request('/api/sources/budapest-opera/import', { method: 'POST' })).status,
    ).toBe(404)
    expect(
      (
        await app.request('/api/performances', { headers: { Origin: 'https://evil.example' } })
      ).headers.has('Access-Control-Allow-Origin'),
    ).toBe(false)
  })

  it('preserves catalogue and freshness on malformed pages and keeps empty imports non-destructive', async () => {
    const database = await open()
    await importMonth(database, '2026-10', () => Promise.resolve(fixture))
    const before = await database.db.select().from(performances)
    await expect(
      importMonth(database, '2026-10', () => Promise.resolve(fixture.replace('20:00', '25:90'))),
    ).rejects.toThrow()
    expect(await database.db.select().from(performances)).toEqual(before)
    await importMonth(database, '2026-10', () => Promise.resolve('<ul class="block-list"></ul>'))
    expect(await database.db.select().from(performances)).toEqual(before)
    expect((await database.db.select().from(runs)).map((run) => run.status)).toEqual([
      'success',
      'error',
      'success',
    ])
  })

  it('updates a ticket-identified performance after a time change without duplicating it', async () => {
    const database = await open()
    await importMonth(database, '2026-10', () => Promise.resolve(fixture))
    const before = await database.db.select().from(performances)
    await importMonth(database, '2026-10', () =>
      Promise.resolve(fixture.replaceAll('20:00', '21:00').replaceAll('-2000/', '-2100/')),
    )
    const after = await database.db.select().from(performances)
    expect(after).toHaveLength(before.length)
    const original = before.find((row) => row.time === '20:00')
    expect(after.find((row) => row.id === original?.id)?.time).toBe('21:00')
  })

  it('rejects concurrent imports and recovers an interrupted lease', async () => {
    const database = await open()
    const now = () => new Date('2026-09-08T12:00:00Z')
    await database.db.insert(runs).values({
      id: 'old',
      sourceKey: 'budapest-opera',
      month: '2026-10',
      status: 'running',
      startedAt: now().toISOString(),
    })
    await expect(
      importMonth(database, '2026-10', () => Promise.resolve(fixture), now),
    ).rejects.toThrow()
    await importMonth(
      database,
      '2026-10',
      () => Promise.resolve(fixture),
      () => new Date('2026-09-08T12:06:00Z'),
    )
    expect((await database.db.select().from(runs)).find((run) => run.id === 'old')).toMatchObject({
      status: 'error',
      errorCode: 'interrupted',
    })
  })
})

describe('source request control', () => {
  it('counts attempts and enforces spacing and hourly budgets across clients', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'allet-budget-'))
    directories.push(directory)
    const database = await open(join(directory, 'test.db'))
    const now = Date.now()
    await reserveRequest(database.client, now)
    const reopened = await open(join(directory, 'test.db'))
    await expect(reserveRequest(reopened.client, now + 1)).rejects.toThrow('paused')
    for (let i = 1; i < policy.hourly; i++) await reserveRequest(reopened.client, now + i * 60_000)
    await expect(reserveRequest(reopened.client, now + 6 * 60_000)).rejects.toThrow('exhausted')
    await reserveRequest(reopened.client, now + 3_600_001)
  })

  it('honours Retry-After without making a paused request; parses dates as well as seconds', async () => {
    const database = await open()
    const now = Date.parse('2026-09-08T12:00:00Z')
    let requests = 0
    const transport: typeof fetch = () => {
      requests++
      return Promise.resolve(new Response('', { status: 429, headers: { 'Retry-After': '7200' } }))
    }
    await expect(requestMonth(database.client, '2026-10', transport, () => now)).rejects.toThrow(
      '429',
    )
    await expect(
      requestMonth(database.client, '2026-10', transport, () => now + 3_600_000),
    ).rejects.toThrow('paused')
    expect(requests).toBe(1)
    expect(retryAfter('Tue, 08 Sep 2026 14:00:00 GMT', now)).toBe(now + 7_200_000)
    expect(retryAfter('nonsense', now)).toBe(0)
  })

  it('constructs only allowed month URLs and refuses invalid input before transport', async () => {
    const database = await open()
    const transport: typeof fetch = (input, init) => {
      expect(input instanceof Request ? input.url : input.toString()).toBe(
        'https://www.opera.hu/en/programme/?y=2026&m=10&datum=&helyszin=&mufaj=',
      )
      expect(init?.redirect).toBe('error')
      return Promise.resolve(new Response(fixture, { headers: { 'Content-Type': 'text/html' } }))
    }
    expect(await requestMonth(database.client, '2026-10', transport)).toBe(fixture)
    await expect(requestMonth(database.client, 'https://evil.example', transport)).rejects.toThrow(
      'Expected month',
    )
  })
})
