import { eq } from 'drizzle-orm'
import { banSchema } from '#shared/schemas/admin'
import { user, session } from '../../../../db/schema/auth'
import { getDb, hasDatabase } from '../../../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const id = String(getRouterParam(event, 'id') ?? '')
  if (id === admin.id) throw createError({ statusCode: 400, statusMessage: 'You cannot ban yourself' })

  const parsed = banSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid ban payload' })

  const db = getDb()
  const expires = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null

  const [before] = await db.select().from(user).where(eq(user.id, id)).limit(1)
  if (!before) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  await db.update(user).set({
    banned: true,
    banReason: parsed.data.reason,
    banExpires: expires,
    updatedAt: new Date(),
  }).where(eq(user.id, id))

  await db.delete(session).where(eq(session.userId, id))
  await writeAudit(event, admin, 'user.ban', 'user', id, { banned: before.banned }, { banned: true, reason: parsed.data.reason })

  return { ok: true }
})
