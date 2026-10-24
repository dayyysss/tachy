import { eq } from 'drizzle-orm'
import { userPatchSchema } from '#shared/schemas/admin'
import { user } from '../../../db/schema/auth'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const id = String(getRouterParam(event, 'id') ?? '')
  const parsed = userPatchSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid patch' })

  if (id === admin.id && parsed.data.role && parsed.data.role !== 'admin') {
    throw createError({ statusCode: 400, statusMessage: 'You cannot demote yourself' })
  }

  const db = getDb()
  const [before] = await db.select().from(user).where(eq(user.id, id)).limit(1)
  if (!before) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  await db.update(user).set({
    ...(parsed.data.role ? { role: parsed.data.role } : {}),
    ...(parsed.data.leaderboardBanned !== undefined ? { leaderboardBanned: parsed.data.leaderboardBanned } : {}),
    updatedAt: new Date(),
  }).where(eq(user.id, id))

  await writeAudit(event, admin, 'user.update', 'user', id, {
    role: before.role,
    leaderboardBanned: before.leaderboardBanned,
  }, parsed.data)

  return { ok: true }
})
