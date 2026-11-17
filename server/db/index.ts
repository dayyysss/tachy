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
    // ponytail: native postgres driver via postgres-js; standard connection without cloud pooler restriction
    client = postgres(process.env.DATABASE_URL!, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {},
    })
    database = drizzle(client, { schema })
  }
  return database
}

export async function closeDb() {
  await client?.end({ timeout: 5 })
  client = null
  database = null
}
