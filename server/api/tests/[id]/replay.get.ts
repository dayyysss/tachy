import { and, eq } from 'drizzle-orm'
import { tests } from '../../../db/schema/tests'
import { shareVisibility } from '../../../db/schema/stats'
import { getDb, hasDatabase } from '../../../db'
import { generateTestText } from '#shared/utils/generator'

export default defineEventHandler(async event => {
  const id = String(getRouterParam(event, 'id') ?? '')
  if (!hasDatabase()) throw createError({ statusCode: 404, statusMessage: 'Replay not found' })

  const db = getDb()
  const [row] = await db.select().from(tests).where(eq(tests.id, id)).limit(1)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Replay not found' })

  const user = await getSessionUser(event)
  if (row.userId !== user?.id && user?.role !== 'admin') {
    const [shared] = await db.select({ testId: shareVisibility.testId }).from(shareVisibility).where(and(
      eq(shareVisibility.testId, id),
      eq(shareVisibility.isPublic, true),
    )).limit(1)
    if (!shared) throw createError({ statusCode: 404, statusMessage: 'Replay not found' })
  }

  const config = {
    language: row.language,
    contentType: row.contentType,
    mode: row.mode,
    amount: row.amount ?? 0,
    punctuation: row.punctuation,
    numbers: row.numbers,
    order: row.order,
    codeLanguage: row.contentType === 'code' ? row.language : 'js',
    quoteLength: 'any' as const,
    codeLength: 'medium' as const,
    customText: undefined,
  }
  const generated = generateTestText(config, row.seed)
  if (row.mode === 'zen') {
    const keystrokes = (row.keystrokes ?? []) as { key: string }[]
    const spaces = keystrokes.filter(keystroke => keystroke.key === ' ').length
    while (generated.words.length < spaces + 2) {
      generated.words.push(...generateTestText({ ...config, amount: 100 }, `${row.seed}:${generated.words.length}`).words)
    }
  }

  return {
    testId: row.id,
    config,
    words: generated.words,
    keystrokes: row.keystrokes,
    durationMs: row.durationMs,
  }
})
