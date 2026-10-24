export default defineEventHandler(async event => {
  await requireRole(event, 'admin')

  const range = Math.min(90, Math.max(1, Number(getQuery(event).range ?? 7) || 7))
  const redis = getRedis()
  if (!redis) return { range, days: [], summary: { requests: 0, e4xx: 0, e5xx: 0 } }

  const days: {
    date: string
    requests: number
    e4xx: number
    e5xx: number
    buckets: Record<string, number>
  }[] = []

  for (let i = range - 1; i >= 0; i--) {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - i)
    const key = date.toISOString().slice(0, 10).replace(/-/g, '')
    const hash = await redis.hgetall<Record<string, string>>(`mon:d:${key}`)
    const value = (field: string) => Number(hash?.[field] ?? 0)
    days.push({
      date: date.toISOString().slice(0, 10),
      requests: value('requests'),
      e4xx: value('e4xx'),
      e5xx: value('e5xx'),
      buckets: {
        b_50: value('b_50'),
        b_100: value('b_100'),
        b_300: value('b_300'),
        b_1000: value('b_1000'),
        b_inf: value('b_inf'),
      },
    })
  }

  return {
    range,
    days,
    summary: {
      requests: days.reduce((sum, day) => sum + day.requests, 0),
      e4xx: days.reduce((sum, day) => sum + day.e4xx, 0),
      e5xx: days.reduce((sum, day) => sum + day.e5xx, 0),
    },
  }
})
