import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm'
import { adminUsersQuerySchema } from '#shared/schemas/admin'
import { user } from '../../../db/schema/auth'
import { userStats } from '../../../db/schema/stats'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const parsed = adminUsersQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid query' })
  const query = parsed.data
  const perPage = 25

  const filters: SQL[] = []
  if (query.q) {
    const needle = `%${query.q}%`
    const search = or(ilike(user.email, needle), ilike(user.username, needle), ilike(user.name, needle))
    if (search) filters.push(search)
  }
  if (query.role) filters.push(eq(user.role, query.role))
  if (query.banned) filters.push(eq(user.banned, query.banned === 'true'))

  const where = filters.length ? and(...filters) : undefined
  const db = getDb()

  const rows = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    banned: user.banned,
    leaderboardBanned: user.leaderboardBanned,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
    xp: userStats.xp,
    level: userStats.level,
    totalTests: userStats.totalTests,
  }).from(user)
    .leftJoin(userStats, eq(userStats.userId, user.id))
    .where(where)
    .orderBy(desc(user.createdAt))
    .limit(perPage)
    .offset((query.page - 1) * perPage)

  const [total] = await db.select({ value: count() }).from(user).where(where)

  return { rows, total: Number(total?.value ?? 0), page: query.page, perPage }
})
