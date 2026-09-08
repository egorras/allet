import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { describe, expect, it } from 'vitest'

import { allPages, allSections } from '@/modules/registry'

/**
 * The registry is typed against the generated route tree, so a page that points at a
 * missing route already fails the build. This checks the other direction: a route that
 * exists but is reachable from no navigation entry.
 */
function generatedStaticRoutes(): string[] {
  const generated = readFileSync(
    fileURLToPath(new URL('../../src/routeTree.gen.ts', import.meta.url)),
    'utf8',
  )
  const toUnion = /fileRoutesByTo: FileRoutesByTo\s+to:\s+((?:\s*\|\s*'[^']+')+)/.exec(generated)
  if (!toUnion?.[1]) throw new Error('Could not read the route union from routeTree.gen.ts')

  return [...toUnion[1].matchAll(/'([^']+)'/g)]
    .map((match) => match[1] ?? '')
    .filter((path) => !path.includes('$'))
}

describe('module registry', () => {
  it('lists every static route in the navigation', () => {
    const registered = new Set<string>(allPages().map((page) => page.path))
    const missing = generatedStaticRoutes().filter((path) => !registered.has(path))

    expect(missing).toEqual([])
  })

  it('has no duplicate addresses', () => {
    const paths = allPages().map((page) => page.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('offers every section in page search', () => {
    for (const section of allSections) {
      expect(section.pages.some((page) => page.searchable)).toBe(true)
    }
  })
})
