import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { adminAuditLogs } from '../../db/schema/settings'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const actionFilter = typeof query.action === 'string' ? query.action.trim() : ''
  const perPage = 50

  const conditions = []
  if (actionFilter) {
    conditions.push(eq(adminAuditLogs.action, actionFilter))
  }
  if (q) {
    conditions.push(
      or(
        ilike(adminAuditLogs.action, `%${q}%`),
        ilike(adminAuditLogs.targetType, `%${q}%`),
        ilike(adminAuditLogs.targetId, `%${q}%`),
        ilike(adminAuditLogs.ip, `%${q}%`),
      )
    )
  }

  const db = getDb()
  const whereClause = conditions.length ? and(...conditions) : undefined

  const [totalRes, rows] = await Promise.all([
    db.select({ total: count() }).from(adminAuditLogs).where(whereClause),
    db.select().from(adminAuditLogs)
      .where(whereClause)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
  ])

  const total = Number(totalRes[0]?.total ?? 0)
  return { rows, total, page, perPage }
})
