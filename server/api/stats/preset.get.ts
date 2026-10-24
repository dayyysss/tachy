const empty = { tests: 0, avgWpm: 0, top: [] as { username: string; wpm: number }[] }

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const key = typeof query.key === 'string' ? query.key.slice(0, 120) : ''
  if (!key) return empty

  const redis = getRedis()
  if (!redis) return empty

  try {
    const stats = await redis.hgetall<Record<string, string>>(`stats:preset:${key}`)
    const tests = Number(stats?.tests ?? 0)
    const avgWpm = Number(stats?.avg_wpm ?? 0)

    const raw = await redis.zrange(`lb:wpm:alltime:all:${key}`, 0, 2, { rev: true, withScores: true })
    const top = (raw as unknown[]).map(item => {
      const record = item as { member?: string; score?: number } | string
      if (typeof record === 'string') return { username: record, wpm: 0 }
      return { username: record.member ?? '', wpm: Math.round(((record.score ?? 0) / 10000000) * 100) / 100 }
    }).filter(item => item.username)

    return { tests, avgWpm, top }
  } catch {
    return empty
  }
})

