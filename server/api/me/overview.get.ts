import { and, desc, eq, gte } from 'drizzle-orm'
import { dailyStats, userAchievements, userStats } from '../../db/schema/stats'
import { tests } from '../../db/schema/tests'
import { getDb, hasDatabase } from '../../db'
import { localDate } from '#shared/utils/dates'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) {
    return { today: null, progress: null, totals: null, week: null, achievements: [] }
  }

  const db = getDb()
  const today = localDate(new Date(), user.timezone || 'UTC')

  const [todayRow] = await db.select().from(dailyStats).where(and(
    eq(dailyStats.userId, user.id),
    eq(dailyStats.localDate, today),
  )).limit(1)

  const [totals] = await db.select().from(userStats).where(eq(userStats.userId, user.id)).limit(1)

  const from = new Date()
  from.setUTCDate(from.getUTCDate() - 7)
  const recent = await db.select().from(dailyStats).where(and(
    eq(dailyStats.userId, user.id),
    gte(dailyStats.localDate, localDate(from, user.timezone || 'UTC')),
  ))

  const userTests = await db.select({
    wpm: tests.wpm,
    consistency: tests.consistency,
    accuracy: tests.accuracy,
  }).from(tests).where(eq(tests.userId, user.id)).limit(100)

  const topWpm = userTests.length ? Math.max(...userTests.map(t => Number(t.wpm))) : 0
  const avgConsistency = userTests.length
    ? userTests.reduce((sum, t) => sum + Number(t.consistency), 0) / userTests.length
    : 0

  const unlockedAchievements = await db.select().from(userAchievements).where(eq(userAchievements.userId, user.id))

  const previous = recent.filter(row => row.localDate !== today)
  const prevTests = previous.reduce((sum, row) => sum + row.testsCount, 0)
  const prevWpm = prevTests
    ? previous.reduce((sum, row) => sum + Number(row.sumWpm), 0) / prevTests
    : 0
  const todayWpm = todayRow && todayRow.testsCount ? Number(todayRow.sumWpm) / todayRow.testsCount : 0

  const delta = prevWpm > 0 && todayWpm > 0 ? ((todayWpm - prevWpm) / prevWpm) * 100 : null

  return {
    today: todayRow ? {
      tests: todayRow.testsCount,
      words: todayRow.wordsTyped,
      timeMs: todayRow.timeMs,
      avgWpm: todayWpm,
      bestWpm: Number(todayRow.bestWpm),
      avgAccuracy: todayRow.testsCount ? Number(todayRow.sumAccuracy) / todayRow.testsCount : 0,
    } : null,
    progress: delta === null ? null : {
      delta,
      label: delta > 2 ? 'improving' : delta < -2 ? 'declining' : 'stable',
      baselineWpm: prevWpm,
    },
    totals: {
      tests: totals?.totalTests ?? 0,
      words: totals?.totalWords ?? 0,
      chars: totals?.totalChars ?? 0,
      timeMs: totals?.totalTimeMs ?? 0,
      xp: totals?.xp ?? 0,
      level: totals?.level ?? 0,
      streak: totals?.currentStreak ?? 0,
      longestStreak: totals?.longestStreak ?? 0,
      topWpm: Math.round(topWpm),
      avgConsistency: Math.round(avgConsistency),
    },
    week: {
      tests: recent.reduce((sum, row) => sum + row.testsCount, 0),
      words: recent.reduce((sum, row) => sum + row.wordsTyped, 0),
    },
    achievements: unlockedAchievements.map(a => ({
      id: a.achievementId,
      unlockedAt: a.unlockedAt,
    })),
  }
})
