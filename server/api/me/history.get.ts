import { desc, eq } from 'drizzle-orm'
import { tests } from '../../db/schema/tests'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) return { rows: [], next: null }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const perPage = 20

  const rows = await getDb().select().from(tests)
    .where(eq(tests.userId, user.id))
    .orderBy(desc(tests.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage)

  return {
    rows: rows.map(row => ({
      id: row.id,
      wpm: Number(row.wpm),
      rawWpm: Number(row.rawWpm),
      accuracy: Number(row.accuracy),
      consistency: Number(row.consistency),
      language: row.language,
      contentType: row.contentType,
      mode: row.mode,
      amount: row.amount,
      durationMs: row.durationMs,
      wordsTyped: row.wordsTyped,
      status: row.status,
      createdAt: row.createdAt,
    })),
    next: rows.length === perPage ? page + 1 : null,
  }
})
