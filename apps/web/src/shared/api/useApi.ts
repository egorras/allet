import { useCallback, useEffect, useState } from 'react'
import type { z } from 'zod'
import { getApi } from './client'

type State<T> =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T }

export function useApi<T>(
  path: `/api/${string}`,
  schema: z.ZodType<T>,
): State<T> & {
  reload: () => void
} {
  const [nonce, setNonce] = useState(0)
  const [result, setResult] = useState<{ path: string; state: State<T> }>({
    path,
    state: { status: 'loading' },
  })
  useEffect(() => {
    const controller = new AbortController()
    void getApi(path, schema, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ path, state: { status: 'ready', data } })
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            path,
            state: {
              status: 'error',
              message:
                error instanceof Error && error.message === 'notFound' ? 'notFound' : 'unavailable',
            },
          })
      },
    )
    return () => {
      controller.abort()
    }
  }, [path, schema, nonce])
  const reload = useCallback(() => {
    setNonce((value) => value + 1)
  }, [])
  return { ...(result.path === path ? result.state : { status: 'loading' as const }), reload }
}
