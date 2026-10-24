import { and, eq, like } from 'drizzle-orm'
import { dailyStats } from '../../db/schema/stats'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) return { days: [] }

  const query = getQuery(event)
  const year = Number(query.year ?? new Date().getUTCFullYear())
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid year' })
  }

  const rows = await getDb().select().from(dailyStats).where(and(
    eq(dailyStats.userId, user.id),
    like(dailyStats.localDate, `${year}-%`),
  ))

  return {
    days: rows.map(row => ({
      date: row.localDate,
      tests: row.testsCount,
      words: row.wordsTyped,
      timeMs: row.timeMs,
      bestWpm: Number(row.bestWpm),
      avgWpm: row.testsCount ? Number(row.sumWpm) / row.testsCount : 0,
    })),
  }
})
