import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

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
})
