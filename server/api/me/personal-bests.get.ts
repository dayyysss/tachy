import { desc, eq } from 'drizzle-orm'
import { personalBests } from '../../db/schema/stats'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) return { rows: [] }

  const rows = await getDb().select().from(personalBests)
    .where(eq(personalBests.userId, user.id))
    .orderBy(desc(personalBests.achievedAt))

  return {
    rows: rows.map(row => ({
      configKey: row.configKey,
      wpm: Number(row.wpm),
      accuracy: Number(row.accuracy),
      testId: row.testId,
      achievedAt: row.achievedAt,
    })),
  }
})
