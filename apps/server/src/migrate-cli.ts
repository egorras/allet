import { openDatabase } from './db/client'
const database = await openDatabase()
database.client.close()
console.log('Database migrations applied.')
