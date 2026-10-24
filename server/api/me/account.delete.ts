import { eq } from 'drizzle-orm'
import { user } from '../../db/schema/auth'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const current = await requireUser(event)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  await getDb().delete(user).where(eq(user.id, current.id))
  const redis = getRedis()
  if (redis) await redis.del(`user:${current.id}`).catch(() => {})

  return { ok: true }
})
