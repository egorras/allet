import { serve } from '@hono/node-server'
import { createApp } from './app'
import { openDatabase } from './db/client'

const database = await openDatabase()
const server = serve(
  {
    fetch: createApp(database).fetch,
    hostname: '127.0.0.1',
    port: Number(process.env.PORT ?? 3001),
  },
  () => {
    console.log('Allet read-only catalogue API listening on loopback')
  },
)
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    server.close(() => {
      database.client.close()
      process.exit(0)
    })
  })
