import { createRouter } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'

export const router = createRouter({
  routeTree,
  // Nothing to preload: v0 has no loaders and no data.
  defaultPreload: false,
  // Drop search parameters no route validated, so a page never sees an unknown
  // parameter or a value its own schema rejected.
  search: { strict: true },
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
