import { count, desc, eq, gte, sum, sql } from 'drizzle-orm'
import { user } from '../../db/schema/auth'
import { tests } from '../../db/schema/tests'
import { userStats } from '../../db/schema/stats'
import { adminAuditLogs } from '../../db/schema/settings'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const db = getDb()
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [users] = await db.select({ value: count() }).from(user)
  const [todayTests] = await db.select({ value: count() }).from(tests).where(gte(tests.createdAt, today))
  const [allTests] = await db.select({ value: count() }).from(tests)
  const [flagged] = await db.select({ value: count() }).from(tests).where(eq(tests.status, 'flagged'))
  const [totals] = await db.select({
    words: sum(userStats.totalWords),
    timeMs: sum(userStats.totalTimeMs),
  }).from(userStats)

  // 14-day activity trend
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13)
  fourteenDaysAgo.setUTCHours(0, 0, 0, 0)

  const dailyRows = await db.select({
    date: sql<string>`to_char(${tests.createdAt}, 'YYYY-MM-DD')`,
    tests: count(),
    avgWpm: sql<string>`COALESCE(ROUND(AVG(${tests.wpm}::numeric), 1), 0)`,
  })
    .from(tests)
    .where(gte(tests.createdAt, fourteenDaysAgo))
    .groupBy(sql`to_char(${tests.createdAt}, 'YYYY-MM-DD')`)

  const dailyMap = new Map(dailyRows.map(r => [r.date, { tests: Number(r.tests), avgWpm: Number(r.avgWpm) }]))

  const activitySeries: { date: string; label: string; tests: number; avgWpm: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    const row = dailyMap.get(key)
    const label = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`
    activitySeries.push({
      date: key,
      label,
      tests: row?.tests ?? 0,
      avgWpm: row?.avgWpm ?? 0,
    })
  }

  // Mode breakdown
  const modeRows = await db.select({
    mode: tests.mode,
    count: count(),
  })
    .from(tests)
    .groupBy(tests.mode)

  const modeDistribution = modeRows.map(r => ({
    mode: r.mode,
    count: Number(r.count),
  }))

  // Status breakdown
  const statusRows = await db.select({
    status: tests.status,
    count: count(),
  })
    .from(tests)
    .groupBy(tests.status)

  const statusDistribution = statusRows.map(r => ({
    status: r.status,
    count: Number(r.count),
  }))

  const audit = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(8)

  return {
    users: Number(users?.value ?? 0),
    testsToday: Number(todayTests?.value ?? 0),
    testsTotal: Number(allTests?.value ?? 0),
    flagged: Number(flagged?.value ?? 0),
    words: Number(totals?.words ?? 0),
    timeMs: Number(totals?.timeMs ?? 0),
    activitySeries,
    modeDistribution,
    statusDistribution,
    audit,
  }
})
