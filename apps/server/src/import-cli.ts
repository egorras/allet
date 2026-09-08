import { openDatabase } from './db/client'
import { importMonth } from './importer'

const month = process.argv[2]
if (!month || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) {
  console.error('Usage: pnpm import:budapest YYYY-MM (2000–2099)')
  process.exitCode = 1
} else {
  const database = await openDatabase()
  try {
    console.log(await importMonth(database, month))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Import failed')
    process.exitCode = 1
  } finally {
    database.client.close()
  }
}
