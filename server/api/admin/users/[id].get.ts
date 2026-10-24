import { desc, eq } from 'drizzle-orm'
import { user } from '../../../db/schema/auth'
import { userStats } from '../../../db/schema/stats'
import { tests } from '../../../db/schema/tests'
import { getDb, hasDatabase } from '../../../db'

export default defineEventHandler(async event => {
  await requireRole(event, 'admin')
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const id = String(getRouterParam(event, 'id') ?? '')
  const db = getDb()

  const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const [stats] = await db.select().from(userStats).where(eq(userStats.userId, id)).limit(1)
  const recent = await db.select({
    id: tests.id,
    wpm: tests.wpm,
    accuracy: tests.accuracy,
    status: tests.status,
    language: tests.language,
    mode: tests.mode,
    createdAt: tests.createdAt,
  }).from(tests).where(eq(tests.userId, id)).orderBy(desc(tests.createdAt)).limit(10)

  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username,
      role: row.role,
      banned: row.banned,
      banReason: row.banReason,
      banExpires: row.banExpires,
      leaderboardBanned: row.leaderboardBanned,
      twoFactorEnabled: row.twoFactorEnabled,
      isPublic: row.isPublic,
      timezone: row.timezone,
      createdAt: row.createdAt,
    },
    stats: stats ?? null,
    recent,
  }
})
