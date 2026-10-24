import { count, desc, eq, gte, sum } from 'drizzle-orm'
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

  const audit = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(8)

  return {
    users: Number(users?.value ?? 0),
    testsToday: Number(todayTests?.value ?? 0),
    testsTotal: Number(allTests?.value ?? 0),
    flagged: Number(flagged?.value ?? 0),
    words: Number(totals?.words ?? 0),
    timeMs: Number(totals?.timeMs ?? 0),
    audit,
  }
})
