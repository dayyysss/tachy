import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

let client: ReturnType<typeof postgres> | null = null
let database: ReturnType<typeof drizzle<typeof schema>> | null = null

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getDb() {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured')
  if (!database) {
    client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 5 })
    database = drizzle(client, { schema })
  }
  return database
}

export async function closeDb() {
  await client?.end({ timeout: 5 })
  client = null
  database = null
}
