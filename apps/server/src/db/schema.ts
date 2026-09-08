import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const sources = sqliteTable('sources', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  lastSuccessAt: text('last_success_at'),
})
export const venues = sqliteTable('venues', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  timeZone: text('time_zone').notNull(),
})
export const productions = sqliteTable('productions', {
  id: text('id').primaryKey(),
  sourceKey: text('source_key')
    .notNull()
    .references(() => sources.key),
  title: text('title').notNull(),
  composer: text('composer'),
  sourceUrl: text('source_url').notNull(),
})
export const performances = sqliteTable('performances', {
  id: text('id').primaryKey(),
  productionId: text('production_id')
    .notNull()
    .references(() => productions.id),
  venueId: text('venue_id')
    .notNull()
    .references(() => venues.id),
  date: text('date').notNull(),
  time: text('time').notNull(),
  sourceUrl: text('source_url').notNull(),
  ticketUrl: text('ticket_url'),
  observedAt: text('observed_at').notNull(),
})
export const schedules = sqliteTable('source_schedules', {
  sourceKey: text('source_key')
    .primaryKey()
    .references(() => sources.key),
  enabled: integer('enabled', { mode: 'boolean' }).notNull(),
  windowMonths: integer('window_months').notNull(),
  intervalMinutes: integer('interval_minutes').notNull(),
})
export const tasks = sqliteTable(
  'sync_tasks',
  {
    sourceKey: text('source_key')
      .notNull()
      .references(() => sources.key),
    month: text('month').notNull(),
    origin: text('origin', { enum: ['window', 'request'] }).notNull(),
    dueAt: text('due_at').notNull(),
    lastRunAt: text('last_run_at'),
    lastStatus: text('last_status', { enum: ['success', 'error', 'deferred'] }),
    failures: integer('failures').notNull(),
  },
  (table) => [primaryKey({ columns: [table.sourceKey, table.month] })],
)
export const runLog = sqliteTable('run_log', {
  id: integer('id').primaryKey(),
  runId: text('run_id')
    .notNull()
    .references(() => runs.id),
  at: text('at').notNull(),
  code: text('code', { enum: ['started', 'fetched', 'parsed', 'stored', 'failed'] }).notNull(),
  detail: text('detail').notNull(),
})
export const runs = sqliteTable('import_runs', {
  id: text('id').primaryKey(),
  sourceKey: text('source_key')
    .notNull()
    .references(() => sources.key),
  month: text('month').notNull(),
  status: text('status', { enum: ['running', 'success', 'error'] }).notNull(),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at'),
  count: integer('count'),
  errorCode: text('error_code', { enum: ['request', 'parse', 'interrupted', 'storage'] }),
  trigger: text('trigger', { enum: ['manual', 'scheduled'] })
    .notNull()
    .default('manual'),
})
