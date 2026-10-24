import { and, eq } from 'drizzle-orm'
import { tests } from '../../db/schema/tests'
import { shareVisibility } from '../../db/schema/stats'
import { user } from '../../db/schema/auth'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const testId = String(getRouterParam(event, 'testId') ?? '')
  if (!hasDatabase()) throw createError({ statusCode: 404, statusMessage: 'Result not found' })

  const db = getDb()
  const [visibility] = await db.select().from(shareVisibility).where(and(
    eq(shareVisibility.testId, testId),
    eq(shareVisibility.isPublic, true),
  )).limit(1)

  if (!visibility) throw createError({ statusCode: 404, statusMessage: 'Result not found' })

  const [row] = await db.select({
    wpm: tests.wpm,
    accuracy: tests.accuracy,
    language: tests.language,
    contentType: tests.contentType,
    mode: tests.mode,
    amount: tests.amount,
    createdAt: tests.createdAt,
    username: user.username,
  }).from(tests)
    .leftJoin(user, eq(tests.userId, user.id))
    .where(eq(tests.id, testId))
    .limit(1)

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Result not found' })

  return {
    wpm: Number(row.wpm),
    accuracy: Number(row.accuracy),
    config: {
      language: row.language,
      contentType: row.contentType,
      mode: row.mode,
      amount: row.amount ?? 0,
    },
    username: row.username,
    createdAt: row.createdAt,
  }
})
