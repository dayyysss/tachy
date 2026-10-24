import { eq } from 'drizzle-orm'
import { reviewSchema } from '#shared/schemas/admin'
import { tests } from '../../../../db/schema/tests'
import { getDb, hasDatabase } from '../../../../db'

export default defineEventHandler(async event => {
  const admin = await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const id = String(getRouterParam(event, 'id') ?? '')
  const parsed = reviewSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid review' })

  const db = getDb()
  const [before] = await db.select({ status: tests.status }).from(tests).where(eq(tests.id, id)).limit(1)
  if (!before) throw createError({ statusCode: 404, statusMessage: 'Test not found' })

  if (parsed.data.action === 'delete') {
    await db.delete(tests).where(eq(tests.id, id))
  } else {
    await db.update(tests).set({
      status: parsed.data.action === 'approve' ? 'valid' : 'flagged',
      reviewedBy: admin.id,
      reviewedAt: new Date(),
      reviewNote: parsed.data.note ?? null,
    }).where(eq(tests.id, id))
  }

  await writeAudit(event, admin, `test.${parsed.data.action}`, 'test', id, before, { action: parsed.data.action })
  return { ok: true }
})
