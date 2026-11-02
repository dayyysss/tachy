import { desc, eq, max } from 'drizzle-orm'
import { user } from '../../db/schema/auth'
import { dailyStats, personalBests, userAchievements, userStats } from '../../db/schema/stats'
import { tests } from '../../db/schema/tests'
import { getDb, hasDatabase } from '../../db'
import { achievementMap } from '#shared/config/achievements'

export default defineEventHandler(async event => {
  const username = String(getRouterParam(event, 'username') ?? '')
  if (!hasDatabase()) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const db = getDb()
  const [profile] = await db.select().from(user).where(eq(user.username, username)).limit(1)
  if (!profile || !profile.isPublic) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const [stats] = await db.select().from(userStats).where(eq(userStats.userId, profile.id)).limit(1)
  const [best] = await db.select({ best: max(tests.wpm) }).from(tests).where(eq(tests.userId, profile.id))

  const [pbs, achs, daily] = await Promise.all([
    db.select().from(personalBests).where(eq(personalBests.userId, profile.id)).orderBy(desc(personalBests.wpm)).limit(12),
    db.select().from(userAchievements).where(eq(userAchievements.userId, profile.id)).orderBy(desc(userAchievements.unlockedAt)),
    db.select().from(dailyStats).where(eq(dailyStats.userId, profile.id)).orderBy(desc(dailyStats.localDate)).limit(365),
  ])

  return {
    username: profile.username,
    displayName: profile.displayUsername ?? profile.name,
    image: profile.image,
    level: stats?.level ?? 0,
    xp: stats?.xp ?? 0,
    currentStreak: stats?.currentStreak ?? 0,
    longestStreak: stats?.longestStreak ?? 0,
    totalTests: stats?.totalTests ?? 0,
    totalWords: stats?.totalWords ?? 0,
    bestWpm: Number(best?.best ?? 0),
    isPublic: profile.isPublic,
    personalBests: pbs.map(p => ({
      configKey: p.configKey,
      wpm: Number(p.wpm),
      accuracy: Number(p.accuracy),
      achievedAt: p.achievedAt,
    })),
    achievements: achs.map(a => {
      const def = achievementMap.get(a.achievementId)
      return {
        id: a.achievementId,
        label: def?.label ?? a.achievementId,
        description: def?.description ?? '',
        unlockedAt: a.unlockedAt,
      }
    }),
    daily: daily.map(d => ({
      localDate: d.localDate,
      testsCount: d.testsCount,
      wordsTyped: d.wordsTyped,
      bestWpm: Number(d.bestWpm),
    })),
  }
})
