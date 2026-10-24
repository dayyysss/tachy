import { count, sum } from 'drizzle-orm'
import { tests } from '../../db/schema/tests'
import { user } from '../../db/schema/auth'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async () => {
  const redis = getRedis()
  if (redis) {
    try {
      const stats = await redis.hgetall<Record<string, string>>('stats:global')
      if (stats) {
        return {
          tests: Number(stats.tests ?? 0),
          words: Number(stats.words ?? 0),
          timeMs: Number(stats.time_ms ?? 0),
          users: Number(stats.users ?? 0),
        }
      }
    } catch {
      // fall through to the database
    }
  }

  if (!hasDatabase()) return { tests: 0, words: 0, timeMs: 0, users: 0 }

  try {
    const db = getDb()
    const [testRow] = await db.select({
      tests: count(),
      words: sum(tests.wordsTyped),
      timeMs: sum(tests.durationMs),
    }).from(tests)
    const [userRow] = await db.select({ users: count() }).from(user)

    return {
      tests: Number(testRow?.tests ?? 0),
      words: Number(testRow?.words ?? 0),
      timeMs: Number(testRow?.timeMs ?? 0),
      users: Number(userRow?.users ?? 0),
    }
  } catch {
    return { tests: 0, words: 0, timeMs: 0, users: 0 }
  }
})
