import { and, asc, eq, notInArray } from 'drizzle-orm'
import type { Database } from './db/client'
import { schedules, tasks } from './db/schema'
import { importMonth, ImportBusyError } from './importer'
import { nextAllowedAt, RequestError } from './requests'

const MINUTE = 60_000
// A failed month waits longer each time, so an outage or a changed page does
// not keep spending the budget. The cap is a week; the source is not retried
// into silence beyond that.
const FAILURE_BACKOFF_CAP = 7 * 24 * 60 * MINUTE
export function failureBackoff(failures: number, intervalMinutes: number) {
  return Math.min(intervalMinutes * MINUTE * 2 ** Math.min(failures, 10), FAILURE_BACKOFF_CAP)
}

/** The `windowMonths` months starting with the one `now` falls in, as `YYYY-MM`. */
export function windowFor(now: Date, windowMonths: number) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  return Array.from({ length: windowMonths }, (_, offset) => {
    const date = new Date(Date.UTC(year, month + offset, 1))
    return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  })
}

/**
 * Deterministic spread of up to one interval, keyed by month. Months discovered
 * together would otherwise keep falling due in the same tick; the offset never
 * moves for a given month, so a displayed due time does not flicker.
 */
export function spread(month: string, intervalMs: number) {
  let hash = 0
  for (const character of month) hash = (hash * 31 + character.charCodeAt(0)) % 100_000
  return Math.round((hash / 100_000) * intervalMs)
}

/**
 * Adds a month the rolling window does not cover, or brings an existing task
 * forward. A requested month is due immediately and outranks window work.
 */
export async function requestMonthSync(
  database: Database,
  sourceKey: string,
  month: string,
  now: Date,
) {
  await database.db
    .insert(tasks)
    .values({
      sourceKey,
      month,
      origin: 'request',
      dueAt: now.toISOString(),
      failures: 0,
    })
    .onConflictDoUpdate({
      target: [tasks.sourceKey, tasks.month],
      set: { origin: 'request', dueAt: now.toISOString(), failures: 0 },
    })
}

/**
 * Brings the stored tasks in line with the rolling window: months that entered
 * it are added due immediately, months that left it are dropped unless they
 * were asked for by hand. Nothing here spends a request.
 */
export async function reconcileWindow(database: Database, sourceKey: string, now: Date) {
  const [schedule] = await database.db
    .select()
    .from(schedules)
    .where(eq(schedules.sourceKey, sourceKey))
  if (!schedule) return []
  const months = windowFor(now, schedule.windowMonths)
  const existing = await database.db.select().from(tasks).where(eq(tasks.sourceKey, sourceKey))
  const known = new Set(existing.map((task) => task.month))
  const added = months.filter((month) => !known.has(month))
  if (added.length > 0)
    await database.db.insert(tasks).values(
      added.map((month) => ({
        sourceKey,
        month,
        origin: 'window' as const,
        dueAt: now.toISOString(),
        failures: 0,
      })),
    )
  await database.db
    .delete(tasks)
    .where(
      and(
        eq(tasks.sourceKey, sourceKey),
        eq(tasks.origin, 'window'),
        notInArray(tasks.month, months),
      ),
    )
  return added
}

/** The task to run now: a hand-picked month first, then the longest overdue. */
export async function dueTask(
  database: Database,
  sourceKey: string,
  now: Date,
  onlyOrigin?: 'window' | 'request',
) {
  const candidates = await database.db
    .select()
    .from(tasks)
    .where(eq(tasks.sourceKey, sourceKey))
    .orderBy(asc(tasks.dueAt), asc(tasks.month))
  return candidates
    .filter((task) => task.dueAt <= now.toISOString())
    .filter((task) => !onlyOrigin || task.origin === onlyOrigin)
    .sort((a, b) => Number(b.origin === 'request') - Number(a.origin === 'request'))[0]
}

export interface TickResult {
  status: 'idle' | 'disabled' | 'deferred' | 'imported' | 'failed'
  month?: string
  until?: string
  message?: string
}

/**
 * One unit of work, at most one request. A gap since the last tick produces a
 * single run for a month rather than one per interval that passed: due times
 * are always recomputed from the moment the run finished.
 */
export async function runTick(
  database: Database,
  sourceKey: string,
  now = () => new Date(),
  load?: (month: string) => Promise<string>,
): Promise<TickResult> {
  const [schedule] = await database.db
    .select()
    .from(schedules)
    .where(eq(schedules.sourceKey, sourceKey))
  if (!schedule) return { status: 'disabled' }
  const at = now()
  // The switch governs the rolling window, not the queue. A month someone
  // asked for by hand is a deliberate request and runs either way — still one
  // at a time and still out of the shared budget. Turning the schedule off
  // stops Allet going looking for work; it does not ignore work it was given.
  if (schedule.enabled) await reconcileWindow(database, sourceKey, at)
  const task = await dueTask(database, sourceKey, at, schedule.enabled ? undefined : 'request')
  if (!task) return { status: schedule.enabled ? 'idle' : 'disabled' }

  // Asked before starting, so a month the budget will not pay for never
  // becomes a failed import in the history.
  const allowedAt = await nextAllowedAt(database.client, at.getTime())
  if (allowedAt > at.getTime()) {
    const until = new Date(allowedAt).toISOString()
    await database.db
      .update(tasks)
      .set({ dueAt: until, lastStatus: 'deferred' })
      .where(and(eq(tasks.sourceKey, sourceKey), eq(tasks.month, task.month)))
    return { status: 'deferred', month: task.month, until }
  }

  try {
    await importMonth(
      database,
      task.month,
      load ? () => load(task.month) : undefined,
      now,
      'scheduled',
    )
    const interval = schedule.intervalMinutes * MINUTE
    // Measured from the moment this run finished, never from when it was due:
    // an idle day produces one run, not one for every interval that passed.
    const finishedAt = now()
    const where = and(eq(tasks.sourceKey, sourceKey), eq(tasks.month, task.month))
    // A month the rolling window covers goes back in the rotation. Anything
    // else was a one-off: it has been done, so it stops being tracked rather
    // than sitting in the queue with a due date nothing will act on.
    if (schedule.enabled && windowFor(finishedAt, schedule.windowMonths).includes(task.month))
      await database.db
        .update(tasks)
        .set({
          dueAt: new Date(
            finishedAt.getTime() + interval + spread(task.month, interval),
          ).toISOString(),
          lastRunAt: finishedAt.toISOString(),
          lastStatus: 'success',
          failures: 0,
          origin: 'window',
        })
        .where(where)
    else await database.db.delete(tasks).where(where)
    return { status: 'imported', month: task.month }
  } catch (error) {
    // A busy source is not this month's fault: leave the task due and let the
    // next tick pick it up rather than counting a failure against it.
    if (error instanceof ImportBusyError) return { status: 'idle' }
    const failures = task.failures + 1
    const dueAt = new Date(
      now().getTime() + failureBackoff(failures, schedule.intervalMinutes),
    ).toISOString()
    // The origin is left alone: a requested month that failed is still a
    // requested month, and retries with backoff rather than being dropped.
    await database.db
      .update(tasks)
      .set({ dueAt, lastRunAt: now().toISOString(), lastStatus: 'error', failures })
      .where(and(eq(tasks.sourceKey, sourceKey), eq(tasks.month, task.month)))
    return {
      status: 'failed',
      month: task.month,
      message: error instanceof RequestError || error instanceof Error ? error.message : 'failed',
    }
  }
}
