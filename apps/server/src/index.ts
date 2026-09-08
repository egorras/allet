import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from './app'
import { openDatabase } from './db/client'

const database = await openDatabase()
const app = createApp(database)

// In a container the built web app is served by this same process, so the
// browser keeps talking to one origin and the no-external-requests rule holds
// without a proxy in front. Locally this is unset and Vite proxies /api here.
const staticRoot = process.env.ALLET_STATIC
if (staticRoot) {
  // An unknown /api path is a missing endpoint, not a client-side route: it
  // must not fall through and answer with the HTML shell.
  app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404))
  app.use('/*', serveStatic({ root: staticRoot }))
  app.get('*', serveStatic({ path: `${staticRoot}/index.html` }))
}

// Loopback unless told otherwise. A container has to bind its own interface;
// nothing else should, so the default stays closed.
const server = serve(
  {
    fetch: app.fetch,
    hostname: process.env.ALLET_HOST ?? '127.0.0.1',
    port: Number(process.env.PORT ?? 3001),
  },
  (info) => {
    console.log(`Allet catalogue API listening on ${info.address}:${String(info.port)}`)
  },
)
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    server.close(() => {
      database.client.close()
      process.exit(0)
    })
  })
