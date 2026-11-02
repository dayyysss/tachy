import { eq, or } from 'drizzle-orm'
import { userCreateSchema } from '#shared/schemas/admin'
import { user } from '../../../db/schema/auth'
import { userStats } from '../../../db/schema/stats'
import { getDb, hasDatabase } from '../../../db'
import { getAuth } from '../../../utils/auth'
import { writeAudit } from '../../../utils/admin'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const body = await readBody(event)
  const parsed = userCreateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid user payload',
    })
  }

  const { email, password, username, role, name } = parsed.data
  const cleanEmail = email.toLowerCase().trim()
  const cleanUsername = username.trim()
  const displayName = name?.trim() || cleanUsername

  const db = getDb()

  // Verify unique email or username before creating
  const [existing] = await db
    .select({ id: user.id, email: user.email, username: user.username })
    .from(user)
    .where(or(eq(user.email, cleanEmail), eq(user.username, cleanUsername)))
    .limit(1)

  if (existing) {
    const field = existing.email.toLowerCase() === cleanEmail ? 'Email' : 'Username'
    throw createError({ statusCode: 409, statusMessage: `${field} is already in use` })
  }

  const auth = getAuth()
  try {
    const result = await auth.api.createUser({
      body: {
        email: cleanEmail,
        password,
        name: displayName,
        role,
        data: {
          username: cleanUsername,
          displayUsername: displayName,
          isPublic: true,
        },
      },
      headers: event.headers,
    })

    const created = result?.user
    if (!created) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create user account' })
    }

    // Ensure username and role match in the primary table
    await db.update(user).set({
      username: cleanUsername,
      displayUsername: displayName,
      role,
      updatedAt: new Date(),
    }).where(eq(user.id, created.id))

    // Initialize user stats row
    await db.insert(userStats).values({
      userId: created.id,
      xp: 0,
      level: 1,
      totalTests: 0,
      totalWords: 0,
      totalChars: 0,
      totalTimeMs: 0,
      currentStreak: 0,
      longestStreak: 0,
    }).onConflictDoNothing()

    await writeAudit(event, admin, 'user.create', 'user', created.id, null, {
      email: cleanEmail,
      username: cleanUsername,
      role,
    })

    return {
      ok: true,
      user: {
        id: created.id,
        email: cleanEmail,
        username: cleanUsername,
        name: displayName,
        role,
      },
    }
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message || 'Failed to create user'
    throw createError({ statusCode: 400, statusMessage: message })
  }
})
