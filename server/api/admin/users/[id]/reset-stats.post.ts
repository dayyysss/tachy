import { eq } from 'drizzle-orm'
import { tests } from '../../../../db/schema/tests'
import { userStats, dailyStats, personalBests, userAchievements, userLanguageStats } from '../../../../db/schema/stats'
import { getDb, hasDatabase } from '../../../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  await requireFreshReauth(event, admin)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const id = String(getRouterParam(event, 'id') ?? '')
  const db = getDb()

  await db.transaction(async tx => {
    await tx.delete(dailyStats).where(eq(dailyStats.userId, id))
    await tx.delete(personalBests).where(eq(personalBests.userId, id))
    await tx.delete(userAchievements).where(eq(userAchievements.userId, id))
    await tx.delete(userLanguageStats).where(eq(userLanguageStats.userId, id))
    await tx.update(tests).set({ status: 'unranked' }).where(eq(tests.userId, id))
    await tx.update(userStats).set({
      totalTests: 0,
      totalWords: 0,
      totalChars: 0,
      totalTimeMs: 0,
      xp: 0,
      level: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      keyErrors: {},
      updatedAt: new Date(),
    }).where(eq(userStats.userId, id))
  })

  await writeAudit(event, admin, 'user.reset-stats', 'user', id, null, { reset: true })
  return { ok: true }
})
