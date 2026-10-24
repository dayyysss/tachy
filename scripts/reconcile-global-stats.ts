import { count, eq, sum } from 'drizzle-orm'
import { getDb } from '../server/db'
import { tests } from '../server/db/schema/tests'
import { user } from '../server/db/schema/auth'
import { getRedis } from '../server/utils/redis'

const redis = getRedis()
if (!redis) {
  console.error('Redis is not configured')
  process.exit(1)
}

const db = getDb()
const [stats] = await db.select({
  tests: count(),
  words: sum(tests.wordsTyped),
  timeMs: sum(tests.durationMs),
}).from(tests).where(eq(tests.status, 'valid'))
const [users] = await db.select({ users: count() }).from(user)

await redis.hset('stats:global', {
  tests: Number(stats?.tests ?? 0),
  words: Number(stats?.words ?? 0),
  time_ms: Number(stats?.timeMs ?? 0),
  users: Number(users?.users ?? 0),
})

const byLanguage = await db.select({
  language: tests.language,
  tests: count(),
  words: sum(tests.wordsTyped),
  timeMs: sum(tests.durationMs),
}).from(tests).where(eq(tests.status, 'valid')).groupBy(tests.language)

for (const row of byLanguage) {
  await redis.hset(`stats:lang:${row.language}`, {
    tests: Number(row.tests ?? 0),
    words: Number(row.words ?? 0),
    time_ms: Number(row.timeMs ?? 0),
  })
}

console.log('Reconciled global stats', { languages: byLanguage.length })
process.exit(0)
