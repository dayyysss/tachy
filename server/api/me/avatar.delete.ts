import { eq } from 'drizzle-orm'
import { user } from '../../db/schema/auth'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const current = await requireUser(event)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Database not available' })

  await getDb().update(user).set({
    image: null,
    updatedAt: new Date(),
  }).where(eq(user.id, current.id))

  return { ok: true }
})
