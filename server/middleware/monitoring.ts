function bucket(durationMs: number): string {
  if (durationMs < 50) return 'b_50'
  if (durationMs < 100) return 'b_100'
  if (durationMs < 300) return 'b_300'
  if (durationMs < 1000) return 'b_1000'
  return 'b_inf'
}

export default defineEventHandler(event => {
  if (!event.path.startsWith('/api/')) return
  if (event.path.startsWith('/api/admin/metrics')) return

  const start = performance.now()
  event.node.res.on('finish', () => {
    const redis = getRedis()
    if (!redis) return
    const duration = performance.now() - start
    const status = event.node.res.statusCode
    const now = new Date()
    const hour = now.toISOString().slice(0, 13).replace(/[-T:]/g, '')
    const day = now.toISOString().slice(0, 10).replace(/-/g, '')
    const fields: Record<string, number> = {
      requests: 1,
      [bucket(duration)]: 1,
      ...(status >= 500 ? { e5xx: 1 } : status >= 400 ? { e4xx: 1 } : {}),
    }

    const pipeline = [
      redis.hincrby(`mon:h:${hour}`, 'requests', 1),
      redis.expire(`mon:h:${hour}`, 172800),
      redis.hincrby(`mon:d:${day}`, 'requests', 1),
      redis.expire(`mon:d:${day}`, 3024000),
    ]

    for (const [field, value] of Object.entries(fields)) {
      if (field === 'requests') continue
      pipeline.push(redis.hincrby(`mon:h:${hour}`, field, value))
      pipeline.push(redis.hincrby(`mon:d:${day}`, field, value))
    }

    Promise.all(pipeline).catch(() => {})
  })
})
