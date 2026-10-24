import { eq } from 'drizzle-orm'
import { getDb } from '../server/db'
import { tests } from '../server/db/schema/tests'
import { userStats } from '../server/db/schema/stats'
import { user } from '../server/db/schema/auth'
import { getRedis } from '../server/utils/redis'
import { buildConfigKey, buildLeaderboardKey, encodeScore } from '../shared/utils/keys'
import { periodId } from '../shared/utils/dates'

const redis = getRedis()
if (!redis) {
  console.error('Redis is not configured (UPSTASH_REDIS_REST_URL / TOKEN)')
  process.exit(1)
}

const db = getDb()
const rows = await db.select({
  test: tests,
  username: user.username,
}).from(tests).leftJoin(user, eq(tests.userId, user.id)).where(eq(tests.status, 'valid'))
console.log(`Rebuilding ${rows.length} valid results`)

let count = 0
for (const entry of rows) {
  const row = entry.test
  const configKey = buildConfigKey({
    language: row.language,
    contentType: row.contentType,
    mode: row.mode,
    amount: row.amount ?? 0,
    punctuation: row.punctuation,
    numbers: row.numbers,
  })
  const score = encodeScore(Number(row.wpm), Number(row.accuracy))
  const [stats] = await db.select({ level: userStats.level }).from(userStats).where(eq(userStats.userId, row.userId)).limit(1)

  for (const period of ['daily', 'weekly', 'alltime'] as const) {
    const id = periodId(period, row.createdAt)
    await redis.zadd(buildLeaderboardKey(period, id, configKey), { gt: true }, { score, member: row.userId })
  }

  const day = periodId('daily', row.createdAt)
  await redis.hset(`user:${row.userId}`, {
    username: entry.username ?? row.userId,
    avatar: '',
    level: stats?.level ?? 0,
    date: day,
  })

  count++
}

console.log(`Rebuilt boards for ${count} tests`)
process.exit(0)
