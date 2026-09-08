// Test-only server. Never seed fixtures into the user's database.
import { readFileSync } from 'node:fs'
import { serve } from '@hono/node-server'
import { openDatabase } from '../src/db/client'
import { importMonth } from '../src/importer'
import { createApp } from '../src/app'
const database = await openDatabase(':memory:')
await importMonth(database, '2026-10', () =>
  Promise.resolve(
    readFileSync(
      new URL('../src/budapest/fixtures/programme_month_2026-10.html', import.meta.url),
      'utf8',
    ),
  ),
)
serve({ fetch: createApp(database).fetch, hostname: '127.0.0.1', port: 3002 })
