import { periodId } from '#shared/utils/dates'
import { buildLeaderboardKey } from '#shared/utils/keys'
import { leaderboardPeriods, type LeaderboardPeriod } from '#shared/config/leaderboard'

function decode(score: number) {
  const wpm = Math.floor(score / 100000) / 100
  const accuracy = (score % 100000) / 100
  return { wpm, accuracy }
}

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const period = (leaderboardPeriods as readonly string[]).includes(String(query.period))
    ? String(query.period) as LeaderboardPeriod
    : 'daily'
  const category = typeof query.category === 'string' ? query.category.slice(0, 120) : 'en:words:time:60'
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const perPage = 50

  const redis = getRedis()
  if (!redis) return { rows: [], total: 0 }

  try {
    const key = buildLeaderboardKey(period, periodId(period), category)
    const start = (page - 1) * perPage
    const raw = await redis.zrange(key, start, start + perPage - 1, { rev: true, withScores: true })
    const total = await redis.zcard(key)

    const items = (raw as unknown[]).map(item => {
      const record = item as { member?: string; score?: number } | string
      if (typeof record === 'string') return { member: record, score: 0 }
      return { member: record.member ?? '', score: record.score ?? 0 }
    })

    const users = await Promise.all(items.map(item => redis.hgetall<Record<string, string>>(`user:${item.member}`)))
    const rows = items.map((item, index) => {
      const meta = users[index] ?? {}
      const decoded = decode(item.score)
      return {
        rank: start + index + 1,
        userId: item.member,
        username: meta.username ?? `player-${item.member.slice(0, 6)}`,
        avatar: meta.avatar ?? null,
        level: Number(meta.level ?? 0),
        wpm: decoded.wpm,
        accuracy: decoded.accuracy,
        date: meta.date ?? '',
      }
    })

    let me: Record<string, unknown> | null = null
    const user = await getSessionUser(event)
    if (user) {
      const rank = await redis.zrank(key, user.id)
      if (rank !== null) {
        const score = await redis.zscore(key, user.id)
        const meta = await redis.hgetall<Record<string, string>>(`user:${user.id}`)
        const decoded = decode(Number(score ?? 0))
        me = {
          rank: rank + 1,
          userId: user.id,
          username: meta?.username ?? user.username ?? user.name,
          avatar: meta?.avatar ?? null,
          level: Number(meta?.level ?? 0),
          wpm: decoded.wpm,
          accuracy: decoded.accuracy,
          date: meta?.date ?? '',
        }
      }
    }

    return { rows, total, me }
  } catch {
    return { rows: [], total: 0, me: null }
  }
})
