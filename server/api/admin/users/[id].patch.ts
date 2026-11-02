import { and, eq, ne } from 'drizzle-orm'
import { userPatchSchema } from '#shared/schemas/admin'
import { user } from '../../../db/schema/auth'
import { getDb, hasDatabase } from '../../../db'
import { getAuth } from '../../../utils/auth'
import { writeAudit } from '../../../utils/admin'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const id = String(getRouterParam(event, 'id') ?? '')
  const parsed = userPatchSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid patch',
    })
  }

  if (id === admin.id && parsed.data.role && parsed.data.role !== 'admin') {
    throw createError({ statusCode: 400, statusMessage: 'You cannot demote yourself' })
  }

  const db = getDb()
  const [before] = await db.select().from(user).where(eq(user.id, id)).limit(1)
  if (!before) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Validate uniqueness if changing username or email
  if (parsed.data.username && parsed.data.username.toLowerCase() !== (before.username?.toLowerCase() ?? '')) {
    const [conflict] = await db.select({ id: user.id })
      .from(user)
      .where(and(eq(user.username, parsed.data.username), ne(user.id, id)))
      .limit(1)
    if (conflict) {
      throw createError({ statusCode: 409, statusMessage: 'Username is already taken' })
    }
  }

  if (parsed.data.email && parsed.data.email.toLowerCase() !== before.email.toLowerCase()) {
    const cleanEmail = parsed.data.email.toLowerCase()
    const [conflict] = await db.select({ id: user.id })
      .from(user)
      .where(and(eq(user.email, cleanEmail), ne(user.id, id)))
      .limit(1)
    if (conflict) {
      throw createError({ statusCode: 409, statusMessage: 'Email is already in use' })
    }
  }

  // Update password if specified
  if (parsed.data.password) {
    try {
      const auth = getAuth()
      await auth.api.setUserPassword({
        body: { userId: id, newPassword: parsed.data.password },
        headers: event.headers,
      })
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to update password'
      throw createError({ statusCode: 400, statusMessage: message })
    }
  }

  const updates: Partial<typeof user.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim()
  if (parsed.data.username !== undefined) updates.username = parsed.data.username.trim()
  if (parsed.data.email !== undefined) updates.email = parsed.data.email.toLowerCase().trim()
  if (parsed.data.role !== undefined) updates.role = parsed.data.role
  if (parsed.data.leaderboardBanned !== undefined) updates.leaderboardBanned = parsed.data.leaderboardBanned
  if (parsed.data.isPublic !== undefined) updates.isPublic = parsed.data.isPublic

  await db.update(user).set(updates).where(eq(user.id, id))

  await writeAudit(event, admin, 'user.update', 'user', id, {
    name: before.name,
    username: before.username,
    email: before.email,
    role: before.role,
    leaderboardBanned: before.leaderboardBanned,
    isPublic: before.isPublic,
  }, {
    ...parsed.data,
    password: parsed.data.password ? '[REDACTED]' : undefined,
  })

  return { ok: true }
})
