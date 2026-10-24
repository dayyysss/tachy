import { desc } from 'drizzle-orm'
import { adminAuditLogs } from '../../db/schema/settings'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const page = Math.max(1, Number(getQuery(event).page ?? 1) || 1)
  const perPage = 50

  const rows = await getDb().select().from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage)

  return { rows, page, perPage }
})
