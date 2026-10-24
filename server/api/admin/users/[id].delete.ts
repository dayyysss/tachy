import { eq } from 'drizzle-orm'
import { user } from '../../../db/schema/auth'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  await requireFreshReauth(event, admin)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const id = String(getRouterParam(event, 'id') ?? '')
  if (id === admin.id) throw createError({ statusCode: 400, statusMessage: 'You cannot delete your own account here' })

  const db = getDb()
  const [before] = await db.select({ email: user.email, username: user.username }).from(user).where(eq(user.id, id)).limit(1)
  if (!before) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  await db.delete(user).where(eq(user.id, id))
  await writeAudit(event, admin, 'user.delete', 'user', id, before, null)

  return { ok: true }
})
