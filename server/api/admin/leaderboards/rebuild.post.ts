import { eq } from 'drizzle-orm'
import { tests } from '../../../db/schema/tests'
import { user } from '../../../db/schema/auth'
import { userStats } from '../../../db/schema/stats'
import { getDb, hasDatabase } from '../../../db'
import { buildConfigKey, buildLeaderboardKey, buildXpKey, encodeScore } from '#shared/utils/keys'
import { periodId } from '#shared/utils/dates'
import { computeXp } from '#shared/utils/xp'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  await requireFreshReauth(event, admin)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const redis = getRedis()
  if (!redis) throw createError({ statusCode: 503, statusMessage: 'Redis is not configured' })

  const stale = await redis.keys('lb:*')
  if (stale.length) await redis.del(...stale)

  const rows = await getDb().select({
    test: tests,
    username: user.username,
    level: userStats.level,
    languageXp: userStats.xp,
  }).from(tests)
    .leftJoin(user, eq(tests.userId, user.id))
    .leftJoin(userStats, eq(userStats.userId, tests.userId))
    .where(eq(tests.status, 'valid'))

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
    for (const period of ['daily', 'weekly', 'alltime'] as const) {
      const id = periodId(period, row.createdAt)
      await redis.zadd(buildLeaderboardKey(period, id, configKey), { gt: true }, { score, member: row.userId })
    }

    await redis.hset(`user:${row.userId}`, {
      username: entry.username ?? row.userId,
      avatar: '',
      level: entry.level ?? 0,
      date: periodId('daily', row.createdAt),
    })
  }

  for (const entry of rows) {
    const row = entry.test
    const xp = computeXp({
      correctChars: row.charsCorrect,
      accuracy: Number(row.accuracy),
      wpm: Number(row.wpm),
      punctuation: row.punctuation,
      numbers: row.numbers,
      code: row.contentType === 'code',
      dailyChallenge: row.isDailyChallenge,
    })
    for (const period of ['daily', 'weekly', 'alltime'] as const) {
      await redis.zincrby(buildXpKey(period, periodId(period, row.createdAt), 'global'), xp, row.userId)
    }
  }

  await writeAudit(event, admin, 'leaderboards.rebuild', 'leaderboard', null, null, { tests: rows.length })
  return { ok: true, tests: rows.length }
})
