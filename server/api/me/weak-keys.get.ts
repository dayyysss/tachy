import { and, desc, eq } from 'drizzle-orm'
import { tests } from '../../db/schema/tests'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) return { keys: [] }

  const rows = await getDb().select({ keystrokes: tests.keystrokes }).from(tests)
    .where(and(eq(tests.userId, user.id), eq(tests.status, 'valid')))
    .orderBy(desc(tests.createdAt))
    .limit(200)

  const counts = new Map<string, { total: number; errors: number }>()
  for (const row of rows) {
    const keystrokes = (row.keystrokes ?? []) as { key: string; correct: boolean }[]
    for (const keystroke of keystrokes) {
      if (keystroke.key.length !== 1) continue
      const key = keystroke.key === ' ' ? 'space' : keystroke.key.toLowerCase()
      const current = counts.get(key) ?? { total: 0, errors: 0 }
      current.total++
      if (!keystroke.correct) current.errors++
      counts.set(key, current)
    }
  }

  return {
    keys: [...counts.entries()]
      .map(([key, value]) => ({
        key,
        total: value.total,
        errors: value.errors,
        rate: value.total ? (value.errors / value.total) * 100 : 0,
      }))
      .filter(item => item.total >= 10)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 30),
  }
})
