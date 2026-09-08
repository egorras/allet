import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const MIGRATION_NAME = /^(\d{4})_[a-z_]+\.sql$/

/** Numbered SQL files in this directory, applied in order. Applied files are never edited. */
export function migrationFiles() {
  return readdirSync(fileURLToPath(new URL('.', import.meta.url)))
    .map((name) => ({ name, match: MIGRATION_NAME.exec(name) }))
    .flatMap(({ name, match }) => (match ? [{ name, version: Number(match[1]) }] : []))
    .sort((a, b) => a.version - b.version)
}

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
  // One transaction per migration: a failure leaves the earlier ones applied
  // and this one absent, so the next start resumes at the same file.
  for (const { name, version } of migrationFiles()) {
    const tx = await client.transaction('write')
    try {
      const applied = await tx.execute({
        sql: 'SELECT version FROM migrations WHERE version = ?',
        args: [version],
      })
      if (applied.rows.length === 0) {
        const sql = readFileSync(new URL(name, import.meta.url), 'utf8')
        // The statements here are plain DDL and seed rows without embedded
        // semicolons; nothing in this directory is generated from input.
        for (const statement of sql.split(';').filter((part) => part.trim()))
          await tx.execute(statement)
        await tx.execute({ sql: 'INSERT INTO migrations(version) VALUES (?)', args: [version] })
      }
      await tx.commit()
    } catch (error) {
      await tx.rollback()
      client.close()
      throw error
    }
  }
  return { client, db: drizzle(client, { schema }) }
}
export type Database = Awaited<ReturnType<typeof openDatabase>>
