import { eq } from 'drizzle-orm'
import { user } from '../../db/schema/auth'
import { tests } from '../../db/schema/tests'
import { dailyStats, userStats, userSettings } from '../../db/schema/stats'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const current = await requireUser(event)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const db = getDb()
  const [profile] = await db.select().from(user).where(eq(user.id, current.id)).limit(1)
  const [stats] = await db.select().from(userStats).where(eq(userStats.userId, current.id)).limit(1)
  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, current.id)).limit(1)
  const history = await db.select().from(tests).where(eq(tests.userId, current.id)).limit(5000)
  const daily = await db.select().from(dailyStats).where(eq(dailyStats.userId, current.id)).limit(5000)

  setHeader(event, 'content-disposition', 'attachment; filename="tachy-export.json"')
  return {
    exportedAt: new Date().toISOString(),
    profile: profile ? {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      displayName: profile.displayUsername,
      timezone: profile.timezone,
      isPublic: profile.isPublic,
      createdAt: profile.createdAt,
    } : null,
    stats: stats ?? null,
    settings: settings?.settings ?? null,
    tests: history,
    daily,
  }
})
