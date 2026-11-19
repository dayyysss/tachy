import { sql } from 'drizzle-orm'
import { getDb, hasDatabase } from '../../db'
import { periodId } from '#shared/utils/dates'
import { buildLeaderboardKey } from '#shared/utils/keys'
import { leaderboardPeriods, type LeaderboardPeriod } from '#shared/config/leaderboard'

function decode(score: number) {
  const wpm = Math.floor(score / 100000) / 100
  const accuracy = (score % 100000) / 100
  return { wpm, accuracy }
}

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const period = (leaderboardPeriods as readonly string[]).includes(String(query.period))
    ? String(query.period) as LeaderboardPeriod
    : 'daily'
  const category = typeof query.category === 'string' && query.category.trim() ? query.category.trim() : 'overall'
  const language = typeof query.language === 'string' && query.language !== 'all' ? query.language.trim() : null
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const perPage = 50
  const offset = (page - 1) * perPage

  const redis = getRedis()
  if (redis && category !== 'overall') {
    try {
      const key = buildLeaderboardKey(period, periodId(period), category)
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
          const decoded = decode(item.score)
          return {
            rank: offset + index + 1,
            userId: item.member,
            username: meta.username ?? `player-${item.member.slice(0, 6)}`,
            avatar: meta.avatar ?? null,
            level: Number(meta.level ?? 0),
            wpm: decoded.wpm,
            accuracy: decoded.accuracy,
            date: meta.date ?? '',
          }
        })

        let me: Record<string, unknown> | null = null
        const sessionUser = await getSessionUser(event)
        if (sessionUser) {
          const rank = await redis.zrank(key, sessionUser.id)
          if (rank !== null) {
            const score = await redis.zscore(key, sessionUser.id)
            const meta = await redis.hgetall<Record<string, string>>(`user:${sessionUser.id}`)
            const decoded = decode(Number(score ?? 0))
            me = {
              rank: rank + 1,
              userId: sessionUser.id,
              username: meta?.username ?? sessionUser.username ?? sessionUser.name,
              avatar: meta?.avatar ?? null,
              level: Number(meta?.level ?? 0),
              wpm: decoded.wpm,
              accuracy: decoded.accuracy,
              date: meta?.date ?? '',
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
    const conditions: string[] = [
      `t.status = 'valid'`,
      `u.banned = false`,
      `u."leaderboardBanned" = false`,
      `u."isPublic" = true`,
    ]

    // Period filter
    if (period === 'daily') {
      conditions.push(`(t.local_date = CURRENT_DATE OR t.created_at >= NOW() - INTERVAL '24 HOURS')`)
    } else if (period === 'weekly') {
      conditions.push(`t.created_at >= NOW() - INTERVAL '7 DAYS'`)
    }

    // Category / preset classification
    if (category !== 'overall') {
      if (category.startsWith('time:')) {
        const amount = Number(category.split(':')[1])
        conditions.push(`t.mode = 'time'`)
        if (amount) conditions.push(`t.amount = ${amount}`)
      } else if (category.startsWith('words:')) {
        const amount = Number(category.split(':')[1])
        conditions.push(`t.mode = 'words'`)
        if (amount) conditions.push(`t.amount = ${amount}`)
      } else if (category === 'quote' || category === 'quotes') {
        conditions.push(`t.mode = 'quote'`)
      } else if (category === 'code') {
        conditions.push(`t.mode = 'code'`)
      } else if (category.startsWith('numbers:')) {
        const amount = Number(category.split(':')[1])
        conditions.push(`t.content_type = 'numbers'`)
        if (amount) conditions.push(`t.amount = ${amount}`)
      } else if (category.includes(':')) {
        // legacy pattern: lang:contentType:mode:amount
        const parts = category.split(':')
        if (parts.length >= 4) {
          conditions.push(`t.language = '${parts[0].replace(/'/g, "''")}'`)
          conditions.push(`t.content_type = '${parts[1].replace(/'/g, "''")}'`)
          conditions.push(`t.mode = '${parts[2].replace(/'/g, "''")}'`)
          if (Number(parts[3])) conditions.push(`t.amount = ${Number(parts[3])}`)
        }
      }
    }

    // Language filter
    if (language) {
      conditions.push(`t.language = '${language.replace(/'/g, "''")}'`)
    }

    const whereClause = conditions.join(' AND ')

    // Fetch top score per unique user
    const querySql = `
      SELECT * FROM (
        SELECT DISTINCT ON (t.user_id)
          t.user_id as "userId",
          COALESCE(u.username, u.name) as username,
          u.image as avatar,
          COALESCE(s.level, 0) as level,
          t.wpm::numeric as wpm,
          t.accuracy::numeric as accuracy,
          t.local_date::text as date
        FROM tests t
        JOIN "user" u ON t.user_id = u.id
        LEFT JOIN user_stats s ON t.user_id = s.user_id
        WHERE ${whereClause}
        ORDER BY t.user_id, t.wpm::numeric DESC, t.accuracy::numeric DESC
      ) sub
      ORDER BY sub.wpm DESC, sub.accuracy DESC
      LIMIT ${perPage} OFFSET ${offset}
    `

    const countSql = `
      SELECT COUNT(DISTINCT t.user_id)::int as total
      FROM tests t
      JOIN "user" u ON t.user_id = u.id
      WHERE ${whereClause}
    `

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
      wpm: Number(r.wpm ?? 0),
      accuracy: Number(r.accuracy ?? 0),
      date: String(r.date ?? ''),
    }))

    // Determine current user's placement if logged in
    let me: Record<string, unknown> | null = null
    const sessionUser = await getSessionUser(event)
    if (sessionUser) {
      const myScoreSql = `
        SELECT t.wpm::numeric as wpm, t.accuracy::numeric as accuracy, t.local_date::text as date, COALESCE(s.level, 0) as level
        FROM tests t
        LEFT JOIN user_stats s ON t.user_id = s.user_id
        WHERE t.user_id = '${sessionUser.id.replace(/'/g, "''")}' AND ${whereClause}
        ORDER BY t.wpm::numeric DESC, t.accuracy::numeric DESC
        LIMIT 1
      `
      const myScoreRes = await db.execute(sql.raw(myScoreSql))
      const myRow = (myScoreRes as unknown as Record<string, unknown>[])[0]
      if (myRow) {
        const myWpm = Number(myRow.wpm ?? 0)
        const myAcc = Number(myRow.accuracy ?? 0)
        const myRankSql = `
          SELECT COUNT(DISTINCT t.user_id)::int as ahead
          FROM tests t
          JOIN "user" u ON t.user_id = u.id
          WHERE ${whereClause} AND (t.wpm::numeric > ${myWpm} OR (t.wpm::numeric = ${myWpm} AND t.accuracy::numeric > ${myAcc}))
        `
        const myRankRes = await db.execute(sql.raw(myRankSql))
        const ahead = Number((myRankRes as unknown as { ahead?: number }[])[0]?.ahead ?? 0)
        me = {
          rank: ahead + 1,
          userId: sessionUser.id,
          username: sessionUser.username ?? sessionUser.name,
          avatar: sessionUser.image ?? null,
          level: Number(myRow.level ?? 0),
          wpm: myWpm,
          accuracy: myAcc,
          date: String(myRow.date ?? ''),
        }
      }
    }

    return { rows, total, me }
  } catch (err) {
    console.error('Failed to query leaderboard from DB:', err)
    return { rows: [], total: 0, me: null }
  }
})
