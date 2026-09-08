// The only process that reaches the outside world. It holds no schedule in
// memory: every tick asks the database what is due, so a restart resumes
// exactly where it stopped and a gap produces one run rather than a burst.
import { openDatabase } from './db/client'
import { runTick } from './scheduler'

const SOURCE = 'budapest-opera'
const interval = Number(process.env.ALLET_TICK_SECONDS ?? 60) * 1000
const database = await openDatabase()
let running = false
let stopping = false

async function tick() {
  if (running || stopping) return
  running = true
  try {
    const result = await runTick(database, SOURCE)
    if (result.status !== 'idle' && result.status !== 'disabled')
      console.log(
        `${SOURCE}: ${result.status} ${result.month ?? ''} ${result.until ?? result.message ?? ''}`.trim(),
      )
  } catch (error) {
    // A tick never takes the worker down: the next one re-reads the state.
    console.error('tick failed', error)
  } finally {
    running = false
  }
}

console.log(`Allet worker started; checking every ${String(interval / 1000)}s`)
void tick()
const timer = setInterval(() => void tick(), interval)
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    stopping = true
    clearInterval(timer)
    // Closing under an in-flight import would tear up its own error handling.
    // Its run row stays 'running' and the lease recovery in importMonth marks
    // it interrupted on the next start, which is what that recovery is for.
    if (!running) database.client.close()
    process.exit(0)
  })
