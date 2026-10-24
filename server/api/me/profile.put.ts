import { eq } from 'drizzle-orm'
import { profileSchema } from '#shared/schemas/profile'
import { user } from '../../db/schema/auth'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const current = await requireUser(event)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const parsed = profileSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid profile' })

  try {
    const [updated] = await getDb().update(user).set({
      name: parsed.data.displayName || parsed.data.username,
      username: parsed.data.username,
      displayUsername: parsed.data.displayName || parsed.data.username,
      isPublic: parsed.data.isPublic,
      timezone: parsed.data.timezone,
      updatedAt: new Date(),
    }).where(eq(user.id, current.id)).returning()

    return {
      ok: true,
      profile: {
        username: updated?.username,
        displayName: updated?.displayUsername,
        isPublic: updated?.isPublic,
        timezone: updated?.timezone,
      },
    }
  } catch {
    throw createError({ statusCode: 409, statusMessage: 'Username is already taken' })
  }
})
