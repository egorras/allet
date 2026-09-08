import type { z } from 'zod'

/**
 * The server has no authentication yet and listens on loopback, so this header
 * is what stops a page on another origin from writing: a custom header forces
 * a preflight, and the server answers none. It is a stopgap that goes away
 * when household sign-in arrives, not a security model.
 */
const LOCAL_HEADER = { 'X-Allet-Local': '1' }

function apiUrl(path: `/api/${string}`) {
  // The only browser network boundary: same origin, no redirects, validated data.
  const url = new URL(path, window.location.origin)
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/'))
    throw new Error('Invalid API path')
  return url
}

export async function getApi<T>(
  path: `/api/${string}`,
  schema: z.ZodType<T>,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    signal,
    redirect: 'error',
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error(response.status === 404 ? 'notFound' : 'unavailable')
  return schema.parse(await response.json())
}

export async function sendApi(
  path: `/api/${string}`,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<void> {
  const response = await fetch(apiUrl(path), {
    method,
    redirect: 'error',
    credentials: 'same-origin',
    headers: { ...LOCAL_HEADER, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!response.ok) throw new Error(response.status === 400 ? 'invalid' : 'unavailable')
}
