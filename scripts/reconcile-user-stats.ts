import { asc } from 'drizzle-orm'
import { getDb } from '../server/db'
import { tests } from '../server/db/schema/tests'
import { dailyStats, userStats, userLanguageStats, personalBests } from '../server/db/schema/stats'

const db = getDb()

const rows = await db.select().from(tests).orderBy(asc(tests.createdAt))
console.log(`Scanning ${rows.length} tests`)

type Agg = {
  totalTests: number
  totalWords: number
  totalChars: number
  totalTimeMs: number
  longestStreak: number
  currentStreak: number
  lastActiveDate: string | null
  days: Set<string>
}

const perUser = new Map<string, Agg>()
const langAgg = new Map<string, Map<string, { tests: number; words: number; timeMs: number }>>()
const dayAgg = new Map<string, Map<string, { tests: number; words: number; timeMs: number; best: number; sumWpm: number; sumAcc: number }>>()
const pbAgg = new Map<string, Map<string, { wpm: number; accuracy: number; testId: string }>>()

for (const t of rows) {
  if (t.status !== 'valid' && t.status !== 'unranked') continue
  const words = t.wordsTyped ?? 0
  const time = Number(t.durationMs ?? 0)
  const chars = (t.charsCorrect ?? 0) + (t.charsIncorrect ?? 0)
  const wpm = Number(t.wpm)
  const acc = Number(t.accuracy)
  const date = t.localDate ?? new Date(t.createdAt).toISOString().slice(0, 10)

  const u = perUser.get(t.userId) ?? {
    totalTests: 0, totalWords: 0, totalChars: 0, totalTimeMs: 0,
    longestStreak: 0, currentStreak: 0, lastActiveDate: null, days: new Set<string>(),
  }
  u.totalTests++
  u.totalWords += words
  u.totalChars += chars
  u.totalTimeMs += time
  u.days.add(date)
  perUser.set(t.userId, u)

  const lang = langAgg.get(t.userId) ?? new Map()
  const l = lang.get(t.language) ?? { tests: 0, words: 0, timeMs: 0 }
  l.tests++; l.words += words; l.timeMs += time
  lang.set(t.language, l)
  langAgg.set(t.userId, lang)

  const days = dayAgg.get(t.userId) ?? new Map()
  const d = days.get(date) ?? { tests: 0, words: 0, timeMs: 0, best: 0, sumWpm: 0, sumAcc: 0 }
  d.tests++; d.words += words; d.timeMs += time
  d.best = Math.max(d.best, wpm)
  d.sumWpm += wpm
  d.sumAcc += acc
  days.set(date, d)
  dayAgg.set(t.userId, days)

  if (t.status === 'valid') {
    const pbs = pbAgg.get(t.userId) ?? new Map()
    const key = `${t.contentType}:${t.mode}:${t.amount ?? ''}:${t.punctuation ? 1 : 0}:${t.numbers ? 1 : 0}:${t.order}:${t.language}`
    const cur = pbs.get(key)
    if (!cur || cur.wpm < wpm) pbs.set(key, { wpm, accuracy: acc, testId: t.id })
    pbAgg.set(t.userId, pbs)
  }
}

function streakFromDays (days: Set<string>): { current: number; longest: number } {
  const sorted = [...days].sort()
  if (!sorted.length) return { current: 0, longest: 0 }
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00Z').getTime()
    const cur = new Date(sorted[i] + 'T00:00:00Z').getTime()
    if (cur - prev === 86400000) run++
    else run = 1
    longest = Math.max(longest, run)
  }
  // current streak: walk backwards from most recent day
  const today = new Date().toISOString().slice(0, 10)
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const last = sorted[sorted.length - 1]
  let current = 0
  if (last === today || last === yest) {
    current = 1
    for (let i = sorted.length - 1; i > 0; i--) {
      const prev = new Date(sorted[i - 1] + 'T00:00:00Z').getTime()
      const cur = new Date(sorted[i] + 'T00:00:00Z').getTime()
      if (cur - prev === 86400000) current++
      else break
    }
  }
  return { current, longest }
}

let userCount = 0
for (const [userId, u] of perUser) {
  const streak = streakFromDays(u.days)
  const sortedDays = [...u.days].sort()
  const lastActiveDate = sortedDays[sortedDays.length - 1] ?? null

  await db.insert(userStats).values({
    userId,
    totalTests: u.totalTests,
    totalWords: u.totalWords,
    totalChars: u.totalChars,
    totalTimeMs: u.totalTimeMs,
    xp: 0,
    level: 0,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    lastActiveDate,
  }).onConflictDoUpdate({
    target: userStats.userId,
    set: {
      totalTests: u.totalTests,
      totalWords: u.totalWords,
      totalChars: u.totalChars,
      totalTimeMs: u.totalTimeMs,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      lastActiveDate,
      updatedAt: new Date(),
    },
  })

  const langs = langAgg.get(userId)
  if (langs) {
    for (const [language, v] of langs) {
      await db.insert(userLanguageStats).values({
        userId, language, xp: 0, level: 0,
        totalTests: v.tests, totalWords: v.words, totalTimeMs: v.timeMs,
      }).onConflictDoUpdate({
        target: [userLanguageStats.userId, userLanguageStats.language],
        set: { totalTests: v.tests, totalWords: v.words, totalTimeMs: v.timeMs, updatedAt: new Date() },
      })
    }
  }

  const days = dayAgg.get(userId)
  if (days) {
    for (const [localDate, d] of days) {
      await db.insert(dailyStats).values({
        userId, localDate,
        testsCount: d.tests, wordsTyped: d.words, timeMs: d.timeMs,
        bestWpm: d.best.toFixed(2), sumWpm: d.sumWpm.toFixed(2), sumAccuracy: d.sumAcc.toFixed(2),
        xpEarned: 0,
      }).onConflictDoUpdate({
        target: [dailyStats.userId, dailyStats.localDate],
        set: {
          testsCount: d.tests, wordsTyped: d.words, timeMs: d.timeMs,
          bestWpm: d.best.toFixed(2), sumWpm: d.sumWpm.toFixed(2), sumAccuracy: d.sumAcc.toFixed(2),
          updatedAt: new Date(),
        },
      })
    }
  }

  const pbs = pbAgg.get(userId)
  if (pbs) {
    for (const [configKey, v] of pbs) {
      await db.insert(personalBests).values({
        userId, configKey, wpm: v.wpm.toFixed(2), accuracy: v.accuracy.toFixed(2), testId: v.testId,
      }).onConflictDoUpdate({
        target: [personalBests.userId, personalBests.configKey],
        set: { wpm: v.wpm.toFixed(2), accuracy: v.accuracy.toFixed(2), testId: v.testId, achievedAt: new Date() },
      })
    }
  }

  userCount++
  console.log(`  user ${userId.slice(0, 8)}: tests=${u.totalTests} words=${u.totalWords} streak=${streak.current}/${streak.longest}`)
}

console.log(`\nReconciled ${userCount} users`)
process.exit(0)
