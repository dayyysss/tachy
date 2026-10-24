import { z } from 'zod'
import { tests } from '../../db/schema/tests'
import { getDb, hasDatabase } from '../../db'
import { localDate } from '#shared/utils/dates'

const importSchema = z.array(z.object({
  id: z.string().min(8).max(128),
  wpm: z.number().min(0).max(1000),
  rawWpm: z.number().min(0).max(2000),
  accuracy: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100).default(0),
  language: z.string().max(16).default('en'),
  contentType: z.enum(['words', 'numbers', 'quotes', 'code']).default('words'),
  mode: z.enum(['time', 'words', 'quote', 'code', 'zen', 'custom']).default('time'),
  amount: z.number().int().min(0).max(1800).default(0),
  durationMs: z.number().int().min(0),
  wordsTyped: z.number().int().min(0),
  createdAt: z.number().int().min(0),
})).max(50)

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const parsed = importSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid history import' })

  const rows = parsed.data.map(entry => ({
    id: crypto.randomUUID(),
    userId: user.id,
    language: entry.language,
    contentType: entry.contentType,
    mode: entry.mode,
    amount: entry.amount || null,
    seed: 'imported',
    wpm: entry.wpm.toFixed(2),
    rawWpm: entry.rawWpm.toFixed(2),
    accuracy: entry.accuracy.toFixed(2),
    consistency: entry.consistency.toFixed(2),
    charsCorrect: 0,
    charsIncorrect: 0,
    charsExtra: 0,
    charsMissed: 0,
    wordsTyped: entry.wordsTyped,
    durationMs: entry.durationMs,
    wpmSeries: [],
    keystrokes: [],
    status: 'unranked' as const,
    isDailyChallenge: false,
    localDate: localDate(new Date(entry.createdAt), user.timezone || 'UTC'),
    createdAt: new Date(entry.createdAt),
  }))

  await getDb().insert(tests).values(rows).onConflictDoNothing()
  return { imported: rows.length }
})
