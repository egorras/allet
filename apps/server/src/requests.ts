import type { Client } from '@libsql/client'

// Local safety budgets, not published opera.hu limits. All attempts, including
// failed requests, count. Reservations and pauses survive CLI/server restarts.
export const policy = { spacing: 10_000, hourly: 6, daily: 24, timeout: 30_000 }
const SERVICE = 'opera.hu'
export class RequestError extends Error {}

export function retryAfter(value: string | null, now: number): number {
  if (!value) return 0
  const seconds = /^\d+$/.test(value) ? Number(value) : NaN
  const until = Number.isFinite(seconds) ? now + seconds * 1000 : Date.parse(value)
  return Number.isFinite(until) ? Math.max(now, until) : 0
}

export async function reserveRequest(client: Client, now: number) {
  const tx = await client.transaction('write')
  try {
    await tx.execute({
      sql: 'INSERT OR IGNORE INTO request_gate(service) VALUES (?)',
      args: [SERVICE],
    })
    const gate = (
      await tx.execute({ sql: 'SELECT * FROM request_gate WHERE service = ?', args: [SERVICE] })
    ).rows[0]
    if (!gate) throw new RequestError('Request gate missing')
    const attempts = await tx.execute({
      sql: 'SELECT sent_at FROM request_attempts WHERE service = ? AND sent_at > ? ORDER BY sent_at',
      args: [SERVICE, now - 86_400_000],
    })
    const hour = attempts.rows.filter((row) => Number(row.sent_at) > now - 3_600_000)
    const waitUntil = Math.max(
      Number(gate.next_at),
      Number(gate.paused_until),
      hour.length >= policy.hourly ? Number(hour[0]?.sent_at) + 3_600_000 : 0,
      attempts.rows.length >= policy.daily ? Number(attempts.rows[0]?.sent_at) + 86_400_000 : 0,
    )
    if (now < waitUntil)
      throw new RequestError(
        `Source paused or budget exhausted; try after ${new Date(waitUntil).toISOString()}`,
      )
    await tx.execute({
      sql: 'UPDATE request_gate SET next_at = ? WHERE service = ?',
      args: [now + policy.timeout + policy.spacing, SERVICE],
    })
    await tx.execute({
      sql: 'INSERT INTO request_attempts(service, sent_at) VALUES (?, ?)',
      args: [SERVICE, now],
    })
    await tx.execute({
      sql: 'DELETE FROM request_attempts WHERE sent_at <= ?',
      args: [now - 86_400_000],
    })
    await tx.commit()
  } catch (error) {
    await tx.rollback()
    throw error
  }
}

export async function requestMonth(
  client: Client,
  month: string,
  transport: typeof fetch = fetch,
  now = () => Date.now(),
) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))
    throw new RequestError('Expected month YYYY-MM (2000–2099)')
  // URL is constructed, never supplied by the browser or by parsed HTML.
  const url = new URL('https://www.opera.hu/en/programme/')
  url.search = new URLSearchParams({
    y: month.slice(0, 4),
    m: month.slice(5),
    datum: '',
    helyszin: '',
    mufaj: '',
  }).toString()
  await reserveRequest(client, now())
  try {
    const response = await transport(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(policy.timeout),
      headers: { 'User-Agent': 'Allet/0.1 (personal programme reader)', Accept: 'text/html' },
    })
    if (!response.ok) {
      const until = retryAfter(response.headers.get('retry-after'), now())
      if (
        response.status === 429 ||
        response.status === 403 ||
        response.status >= 500 ||
        until > 0
      ) {
        await client.execute({
          sql: 'UPDATE request_gate SET failures = failures + 1, paused_until = MAX(paused_until, ?, ? + MIN(86400000, 3600000 * (1 << MIN(failures, 5)))) WHERE service = ?',
          args: [until, now(), SERVICE],
        })
      }
      throw new RequestError(`Source returned HTTP ${String(response.status)}`)
    }
    if (!response.headers.get('content-type')?.includes('text/html'))
      throw new RequestError('Expected an HTML programme page')
    const reader = response.body?.getReader()
    if (!reader) throw new RequestError('Empty response')
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      for (;;) {
        const chunk = await reader.read()
        if (chunk.done) break
        size += chunk.value.byteLength
        if (size > 5_000_000) throw new RequestError('Programme exceeds size limit')
        chunks.push(chunk.value)
      }
    } finally {
      await reader.cancel()
    }
    return Buffer.concat(chunks).toString('utf8')
  } catch (error) {
    throw error instanceof RequestError
      ? error
      : new RequestError('Source request failed; no data was changed')
  } finally {
    await client.execute({
      sql: 'UPDATE request_gate SET next_at = ? WHERE service = ?',
      args: [now() + policy.spacing, SERVICE],
    })
  }
}
