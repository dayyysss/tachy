import { sql } from 'drizzle-orm'
import { getDb, hasDatabase } from '../../db'
import { redisPing } from '../../utils/redis'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')

  const checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }> = {}

  if (hasDatabase()) {
    const start = performance.now()
    try {
      await getDb().execute(sql`select 1`)
      checks.database = { ok: true, latencyMs: Math.round(performance.now() - start) }
    } catch (cause) {
      checks.database = { ok: false, detail: cause instanceof Error ? cause.message : 'unreachable' }
    }
  } else {
    checks.database = { ok: false, detail: 'DATABASE_URL missing' }
  }

  const redisStart = performance.now()
  const redisOk = await redisPing()
  checks.redis = { ok: redisOk, latencyMs: Math.round(performance.now() - redisStart) }
  checks.storage = { ok: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY), detail: 'Supabase Storage' }
  checks.email = { ok: Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM), detail: 'Transactional email' }

  return {
    checks,
    version: process.env.npm_package_version ?? 'dev',
    region: process.env.VERCEL_REGION ?? 'local',
    node: process.version,
  }
})
