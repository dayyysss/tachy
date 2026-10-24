import { eq } from 'drizzle-orm'
import { user } from '../../../../db/schema/auth'
import { getDb, hasDatabase } from '../../../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const id = String(getRouterParam(event, 'id') ?? '')
  const db = getDb()
  await db.update(user).set({
    banned: false,
    banReason: null,
    banExpires: null,
    updatedAt: new Date(),
  }).where(eq(user.id, id))

  await writeAudit(event, admin, 'user.unban', 'user', id, { banned: true }, { banned: false })
  return { ok: true }
})
