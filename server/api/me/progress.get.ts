import { and, eq, gte } from 'drizzle-orm'
import { tests } from '../../db/schema/tests'
import { getDb, hasDatabase } from '../../db'
import { localDate } from '#shared/utils/dates'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) return { points: [] }

  const query = getQuery(event)
  const range = Math.min(365, Math.max(7, Number(query.range ?? 30) || 30))
  const language = typeof query.language === 'string' ? query.language : ''

  const from = new Date()
  from.setUTCDate(from.getUTCDate() - range)

  const rows = await getDb().select({
    date: tests.localDate,
    wpm: tests.wpm,
    accuracy: tests.accuracy,
    language: tests.language,
  }).from(tests).where(and(
    eq(tests.userId, user.id),
    gte(tests.createdAt, from),
    language ? eq(tests.language, language) : undefined,
  ))

  const grouped = new Map<string, { wpm: number; accuracy: number; count: number }>()
  for (const row of rows) {
    const key = String(row.date)
    const current = grouped.get(key) ?? { wpm: 0, accuracy: 0, count: 0 }
    current.wpm += Number(row.wpm)
    current.accuracy += Number(row.accuracy)
    current.count++
    grouped.set(key, current)
  }

  return {
    points: [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        wpm: value.count ? value.wpm / value.count : 0,
        accuracy: value.count ? value.accuracy / value.count : 0,
        tests: value.count,
      })),
    today: localDate(),
  }
})
