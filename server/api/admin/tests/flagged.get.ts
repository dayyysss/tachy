import { desc, eq } from 'drizzle-orm'
import { tests } from '../../../db/schema/tests'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const page = Math.max(1, Number(getQuery(event).page ?? 1) || 1)
  const perPage = 25

  const rows = await getDb().select().from(tests)
    .where(eq(tests.status, 'flagged'))
    .orderBy(desc(tests.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage)

  return {
    rows: rows.map(row => ({
      id: row.id,
      userId: row.userId,
      language: row.language,
      mode: row.mode,
      amount: row.amount,
      wpm: Number(row.wpm),
      accuracy: Number(row.accuracy),
      durationMs: row.durationMs,
      flagReasons: row.flagReasons,
      createdAt: row.createdAt,
    })),
    page,
    perPage,
  }
})
