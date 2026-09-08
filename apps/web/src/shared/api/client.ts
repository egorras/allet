import type { z } from 'zod'

export async function getApi<T>(
  path: `/api/${string}`,
  schema: z.ZodType<T>,
  signal: AbortSignal,
): Promise<T> {
  // The only browser network boundary: same origin, no redirects, validated data.
  const url = new URL(path, window.location.origin)
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/'))
    throw new Error('Invalid API path')
  const response = await fetch(url, { signal, redirect: 'error', credentials: 'same-origin' })
  if (!response.ok) throw new Error(response.status === 404 ? 'notFound' : 'unavailable')
  return schema.parse(await response.json())
}
