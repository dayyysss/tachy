import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

let redis: Redis | null = null

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

export async function redisPing(): Promise<boolean> {
  const client = getRedis()
  if (!client) return false
  try {
    await client.ping()
    return true
  } catch {
    return false
  }
}

const limiters = new Map<string, Ratelimit>()

export function getLimiter(name: string, limit: number, window: `${number} ${'s' | 'm' | 'h'}`): Ratelimit | null {
  const client = getRedis()
  if (!client) return null
  const key = `${name}:${limit}:${window}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${name}`,
    })
    limiters.set(key, limiter)
  }
  return limiter
}
