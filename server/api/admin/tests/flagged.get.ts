import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { tests } from '../../../db/schema/tests'
import { user } from '../../../db/schema/auth'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const mode = typeof query.mode === 'string' ? query.mode.trim() : ''
  const language = typeof query.language === 'string' ? query.language.trim() : ''
  const perPage = 25

  const conditions = [eq(tests.status, 'flagged')]
  if (mode) conditions.push(eq(tests.mode, mode))
  if (language) conditions.push(eq(tests.language, language))
  if (q) {
    conditions.push(
      or(
        ilike(tests.id, `%${q}%`),
        ilike(user.username, `%${q}%`),
        ilike(user.email, `%${q}%`),
      )
    )
  }

  const db = getDb()
  const rows = await db.select({
    id: tests.id,
    userId: tests.userId,
    username: user.username,
    userEmail: user.email,
    language: tests.language,
    mode: tests.mode,
    amount: tests.amount,
    wpm: tests.wpm,
    accuracy: tests.accuracy,
    durationMs: tests.durationMs,
    flagReasons: tests.flagReasons,
    createdAt: tests.createdAt,
  }).from(tests)
    .leftJoin(user, eq(tests.userId, user.id))
    .where(and(...conditions))
    .orderBy(desc(tests.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage)

  return {
    rows: rows.map(row => ({
      id: row.id,
      userId: row.userId,
      username: row.username,
      userEmail: row.userEmail,
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
