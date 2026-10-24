import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { tests } from '../../../db/schema/tests'
import { shareVisibility } from '../../../db/schema/stats'
import { getDb, hasDatabase } from '../../../db'

const bodySchema = z.object({ isPublic: z.boolean() })

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const testId = String(getRouterParam(event, 'testId') ?? '')
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })

  const db = getDb()
  const [test] = await db.select({ id: tests.id }).from(tests).where(and(
    eq(tests.id, testId),
    eq(tests.userId, user.id),
  )).limit(1)
  if (!test) throw createError({ statusCode: 404, statusMessage: 'Result not found' })

  await db.insert(shareVisibility).values({
    testId,
    isPublic: parsed.data.isPublic,
  }).onConflictDoUpdate({
    target: shareVisibility.testId,
    set: { isPublic: parsed.data.isPublic },
  })

  return { ok: true, isPublic: parsed.data.isPublic }
})
