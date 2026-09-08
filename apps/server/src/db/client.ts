import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

export async function openDatabase(
  path = process.env.ALLET_DB ?? fileURLToPath(new URL('../../data/allet.db', import.meta.url)),
) {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true })
  const client = createClient({
    url: path === ':memory:' ? 'file::memory:' : pathToFileURL(resolve(path)).href,
  })
  await client.execute('PRAGMA foreign_keys = ON')
  await client.execute('PRAGMA busy_timeout = 5000')
  if (path !== ':memory:') await client.execute('PRAGMA journal_mode = WAL')
  await client.execute('CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY)')
  const tx = await client.transaction('write')
  try {
    const existing = await tx.execute('SELECT version FROM migrations WHERE version = 1')
    if (existing.rows.length === 0) {
      const sql = readFileSync(new URL('./0001_catalogue.sql', import.meta.url), 'utf8')
      for (const statement of sql.split(';').filter((part) => part.trim()))
        await tx.execute(statement)
      await tx.execute('INSERT INTO migrations(version) VALUES (1)')
    }
    await tx.commit()
  } catch (error) {
    await tx.rollback()
    client.close()
    throw error
  }
  return { client, db: drizzle(client, { schema }) }
}
export type Database = Awaited<ReturnType<typeof openDatabase>>
