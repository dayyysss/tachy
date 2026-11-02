import { sql } from 'drizzle-orm'
import { getDb, hasDatabase } from '../../db'
import { getRedis, redisPing } from '../../utils/redis'
import { getStorage, storageConfigured } from '../../utils/storage'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')

  const checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }> = {}

  // 1. Database Check
  if (hasDatabase()) {
    const start = performance.now()
    try {
      await getDb().execute(sql`select 1`)
      checks.database = {
        ok: true,
        latencyMs: Math.round(performance.now() - start),
        detail: 'Primary Database Operational',
      }
    } catch (cause) {
      checks.database = {
        ok: false,
        detail: cause instanceof Error ? cause.message : 'Database unreachable',
      }
    }
  } else {
    checks.database = { ok: false, detail: 'Database service not configured' }
  }

  // 2. Cache Check
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    checks.cache = { ok: false, detail: 'Cache service credentials not configured' }
  } else {
    const redisStart = performance.now()
    const redisOk = await redisPing()
    checks.cache = {
      ok: redisOk,
      latencyMs: Math.round(performance.now() - redisStart),
      detail: redisOk ? 'Memory cache operational' : 'Cache service unreachable',
    }
  }

  // 3. Storage Check
  if (!storageConfigured()) {
    checks.storage = { ok: false, detail: 'Storage service not configured' }
  } else {
    const storageStart = performance.now()
    try {
      const storage = getStorage()
      const { error } = await storage!.storage.from('public').list('', { limit: 1 })
      if (error) {
        checks.storage = { ok: false, detail: error.message }
      } else {
        checks.storage = {
          ok: true,
          latencyMs: Math.round(performance.now() - storageStart),
          detail: 'Cloud storage operational',
        }
      }
    } catch (err: unknown) {
      checks.storage = {
        ok: false,
        detail: (err as Error)?.message || 'Storage connection error',
      }
    }
  }

  // 4. Email Check
  if (!process.env.EMAIL_API_KEY || !process.env.EMAIL_FROM) {
    checks.email = { ok: false, detail: 'EMAIL_API_KEY / FROM not set in .env' }
  } else {
    checks.email = { ok: true, detail: `Transactional email (${process.env.EMAIL_FROM})` }
  }

  return {
    checks,
    version: process.env.npm_package_version ?? '1.0.0',
    region: process.env.VERCEL_REGION ?? 'local',
    node: process.version,
  }
})
