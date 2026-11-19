import { sql } from 'drizzle-orm'
import { getDb, hasDatabase } from '../../db'
import { periodId } from '#shared/utils/dates'
import { buildXpKey } from '#shared/utils/keys'
import { leaderboardPeriods, type LeaderboardPeriod } from '#shared/config/leaderboard'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const period = (leaderboardPeriods as readonly string[]).includes(String(query.period))
    ? String(query.period) as LeaderboardPeriod
    : 'daily'
  const scope = typeof query.scope === 'string' ? query.scope.slice(0, 32) : 'global'
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const perPage = 50
  const offset = (page - 1) * perPage

  const redis = getRedis()
  if (redis) {
    try {
      const key = buildXpKey(period, periodId(period), scope)
      const total = await redis.zcard(key)
      if (total > 0) {
        const raw = await redis.zrange(key, offset, offset + perPage - 1, { rev: true, withScores: true })
        const items = (raw as unknown[]).map(item => {
          const record = item as { member?: string; score?: number } | string
          if (typeof record === 'string') return { member: record, score: 0 }
          return { member: record.member ?? '', score: record.score ?? 0 }
        })

        const users = await Promise.all(items.map(item => redis.hgetall<Record<string, string>>(`user:${item.member}`)))
        const rows = items.map((item, index) => {
          const meta = users[index] ?? {}
          return {
            rank: offset + index + 1,
            userId: item.member,
            username: meta.username ?? `player-${item.member.slice(0, 6)}`,
            avatar: meta.avatar ?? null,
            level: Number(meta.level ?? 0),
            xp: Math.round(item.score),
          }
        })

        let me: Record<string, unknown> | null = null
        const sessionUser = await getSessionUser(event)
        if (sessionUser) {
          const rank = await redis.zrank(key, sessionUser.id)
          if (rank !== null) {
            const score = await redis.zscore(key, sessionUser.id)
            const meta = await redis.hgetall<Record<string, string>>(`user:${sessionUser.id}`)
            me = {
              rank: rank + 1,
              userId: sessionUser.id,
              username: meta?.username ?? sessionUser.username ?? sessionUser.name,
              avatar: meta?.avatar ?? null,
              level: Number(meta?.level ?? 0),
              xp: Math.round(Number(score ?? 0)),
            }
          }
        }

        return { rows, total, me }
      }
    } catch {
      // Fall through to database
    }
  }

  // Database fallback (active when Redis is unconfigured or empty)
  if (!hasDatabase()) return { rows: [], total: 0, me: null }

  try {
    const db = getDb()
    let querySql = ''
    let countSql = ''

    if (period === 'alltime') {
      querySql = `
        SELECT
          u.id as "userId",
          COALESCE(u.username, u.name) as username,
          u.image as avatar,
          COALESCE(s.level, 0) as level,
          COALESCE(s.xp, 0) as xp
        FROM "user" u
        JOIN user_stats s ON u.id = s.user_id
        WHERE u.banned = false AND u."leaderboardBanned" = false AND u."isPublic" = true
        ORDER BY s.xp DESC
        LIMIT ${perPage} OFFSET ${offset}
      `
      countSql = `
        SELECT COUNT(u.id)::int as total
        FROM "user" u
        JOIN user_stats s ON u.id = s.user_id
        WHERE u.banned = false AND u."leaderboardBanned" = false AND u."isPublic" = true
      `
    } else if (period === 'daily') {
      querySql = `
        SELECT
          u.id as "userId",
          COALESCE(u.username, u.name) as username,
          u.image as avatar,
          COALESCE(s.level, 0) as level,
          d.xp_earned as xp
        FROM daily_stats d
        JOIN "user" u ON d.user_id = u.id
        LEFT JOIN user_stats s ON u.id = s.user_id
        WHERE (d.local_date = CURRENT_DATE OR d.updated_at >= NOW() - INTERVAL '24 HOURS')
          AND u.banned = false AND u."leaderboardBanned" = false AND u."isPublic" = true
        ORDER BY d.xp_earned DESC
        LIMIT ${perPage} OFFSET ${offset}
      `
      countSql = `
        SELECT COUNT(d.user_id)::int as total
        FROM daily_stats d
        JOIN "user" u ON d.user_id = u.id
        WHERE (d.local_date = CURRENT_DATE OR d.updated_at >= NOW() - INTERVAL '24 HOURS')
          AND u.banned = false AND u."leaderboardBanned" = false AND u."isPublic" = true
      `
    } else {
      // weekly
      querySql = `
        SELECT
          d.user_id as "userId",
          COALESCE(u.username, u.name) as username,
          u.image as avatar,
          COALESCE(s.level, 0) as level,
          SUM(d.xp_earned)::int as xp
        FROM daily_stats d
        JOIN "user" u ON d.user_id = u.id
        LEFT JOIN user_stats s ON u.id = s.user_id
        WHERE (d.local_date >= CURRENT_DATE - 7 OR d.updated_at >= NOW() - INTERVAL '7 DAYS')
          AND u.banned = false AND u."leaderboardBanned" = false AND u."isPublic" = true
        GROUP BY d.user_id, u.username, u.name, u.image, s.level
        ORDER BY xp DESC
        LIMIT ${perPage} OFFSET ${offset}
      `
      countSql = `
        SELECT COUNT(DISTINCT d.user_id)::int as total
        FROM daily_stats d
        JOIN "user" u ON d.user_id = u.id
        WHERE (d.local_date >= CURRENT_DATE - 7 OR d.updated_at >= NOW() - INTERVAL '7 DAYS')
          AND u.banned = false AND u."leaderboardBanned" = false AND u."isPublic" = true
      `
    }

    const [rowsRes, countRes] = await Promise.all([
      db.execute(sql.raw(querySql)),
      db.execute(sql.raw(countSql)),
    ])

    const total = Number((countRes as unknown as { total?: number }[])[0]?.total ?? 0)
    const rawRows = Array.from(rowsRes as unknown as Record<string, unknown>[])
    const rows = rawRows.map((r, i) => ({
      rank: offset + i + 1,
      userId: String(r.userId),
      username: String(r.username),
      avatar: r.avatar ? String(r.avatar) : null,
      level: Number(r.level ?? 0),
      xp: Number(r.xp ?? 0),
    }))

    let me: Record<string, unknown> | null = null
    const sessionUser = await getSessionUser(event)
    if (sessionUser) {
      const myRow = rows.find(r => r.userId === sessionUser.id)
      if (myRow) {
        me = myRow
      }
    }

    return { rows, total, me }
  } catch (err) {
    console.error('Failed to query XP leaderboard from DB:', err)
    return { rows: [], total: 0, me: null }
  }
})
