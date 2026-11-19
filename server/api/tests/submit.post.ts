import { eq, and, sql } from 'drizzle-orm'
import { submitTestSchema } from '#shared/schemas/test'
import { configKeyFromTest, encodeScore, buildLeaderboardKey, buildXpKey } from '#shared/utils/keys'
import { generateTestText } from '#shared/utils/generator'
import { replaySession } from '#shared/utils/engine'
import { assessTest, hardReject } from '#shared/utils/antiCheat'
import { computeXp, levelFromXp } from '#shared/utils/xp'
import { isRankedPreset, eligibility } from '#shared/config/leaderboard'
import { localDate, periodId } from '#shared/utils/dates'
import { tests } from '../../db/schema/tests'
import { dailyStats, personalBests, userStats, userLanguageStats, userAchievements } from '../../db/schema/stats'
import { getDb, hasDatabase } from '../../db'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  if (!hasDatabase()) throw createError({ statusCode: 503, statusMessage: 'Persistence is not configured' })

  const body = await readBody(event)
  const parsed = submitTestSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid submission' })
  const input = parsed.data

  const token = verifyTestToken(input.token)
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Invalid or expired test token' })
  if (token.userId && token.userId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Token owner mismatch' })
  if (token.seed !== input.seed) throw createError({ statusCode: 400, statusMessage: 'Seed mismatch' })
  if (token.testId !== input.testId) throw createError({ statusCode: 400, statusMessage: 'Test id mismatch' })

  const configKey = configKeyFromTest(input.config)
  if (configKey !== token.configKey) throw createError({ statusCode: 400, statusMessage: 'Config mismatch' })

  const generated = generateTestText(input.config, input.seed)
  if (input.config.mode === 'zen') {
    const spaces = input.keystrokes.filter(keystroke => keystroke.key === ' ').length
    while (generated.words.length < spaces + 2) {
      generated.words.push(...generateTestText({ ...input.config, amount: 100 }, `${input.seed}:${generated.words.length}`).words)
    }
  }
  const session = replaySession(generated.words, input.keystrokes)
  const end = input.keystrokes[input.keystrokes.length - 1]?.t ?? 0
  const metrics = session.snapshot(end)

  if (hardReject(metrics.wpm)) throw createError({ statusCode: 422, statusMessage: 'Result rejected' })

  const verdict = assessTest({
    wpm: metrics.wpm,
    accuracy: metrics.accuracy,
    durationMs: metrics.durationMs,
    keystrokes: input.keystrokes,
    claimedWpm: input.claimed.wpm,
  })

  const eligible =
    input.config.order === 'random' &&
    metrics.accuracy >= eligibility.minAccuracy &&
    (metrics.durationMs >= eligibility.minTimeSeconds * 1000 || metrics.wordsTyped >= eligibility.minWords) &&
    isRankedPreset(input.config.contentType, input.config.mode, input.config.amount)

  const status = verdict.status === 'flagged' ? 'flagged' : eligible ? 'valid' : 'unranked'
  const xp = computeXp({
    correctChars: metrics.charsCorrect,
    accuracy: metrics.accuracy,
    wpm: metrics.wpm,
    punctuation: input.config.punctuation,
    numbers: input.config.numbers,
    code: input.config.contentType === 'code',
    dailyChallenge: input.isDailyChallenge,
  })

  const db = getDb()
  const local = localDate(new Date(), user.timezone || 'UTC')

  let inserted = false
  let isPB = false
  let level = 0
  let levelUp = false
  const newAchievements: string[] = []

  try {
    await db.transaction(async tx => {
      await tx.insert(tests).values({
        id: input.testId,
        userId: user.id,
        language: input.config.contentType === 'code' ? input.config.codeLanguage : input.config.language,
        contentType: input.config.contentType,
        mode: input.config.mode,
        amount: input.config.amount || null,
        punctuation: input.config.punctuation,
        numbers: input.config.numbers,
        order: input.config.order,
        seed: input.seed,
        wpm: metrics.wpm.toFixed(2),
        rawWpm: metrics.rawWpm.toFixed(2),
        accuracy: metrics.accuracy.toFixed(2),
        consistency: metrics.consistency.toFixed(2),
        charsCorrect: metrics.charsCorrect,
        charsIncorrect: metrics.charsIncorrect,
        charsExtra: metrics.charsExtra,
        charsMissed: metrics.charsMissed,
        wordsTyped: metrics.wordsTyped,
        durationMs: Math.round(metrics.durationMs),
        wpmSeries: metrics.series,
        keystrokes: input.keystrokes,
        status,
        flagReasons: verdict.reasons.length ? verdict.reasons : null,
        isDailyChallenge: input.isDailyChallenge,
        localDate: local,
      })
      inserted = true

      if (status === 'valid' || status === 'unranked') {
        await tx.insert(dailyStats).values({
          userId: user.id,
          localDate: local,
          testsCount: 1,
          wordsTyped: metrics.wordsTyped,
          timeMs: Math.round(metrics.durationMs),
          bestWpm: metrics.wpm.toFixed(2),
          sumWpm: metrics.wpm.toFixed(2),
          sumAccuracy: metrics.accuracy.toFixed(2),
          xpEarned: xp,
        }).onConflictDoUpdate({
          target: [dailyStats.userId, dailyStats.localDate],
          set: {
            testsCount: sql`${dailyStats.testsCount} + 1`,
            wordsTyped: sql`${dailyStats.wordsTyped} + ${metrics.wordsTyped}`,
            timeMs: sql`${dailyStats.timeMs} + ${Math.round(metrics.durationMs)}`,
            sumWpm: sql`${dailyStats.sumWpm} + ${metrics.wpm}`,
            sumAccuracy: sql`${dailyStats.sumAccuracy} + ${metrics.accuracy}`,
            bestWpm: sql`GREATEST(${dailyStats.bestWpm}, ${metrics.wpm})`,
            xpEarned: sql`${dailyStats.xpEarned} + ${xp}`,
            updatedAt: new Date(),
          },
        })
        const [current] = await tx.select().from(userStats).where(eq(userStats.userId, user.id)).limit(1)
        const nextXp = (current?.xp ?? 0) + xp
        level = levelFromXp(nextXp)
        levelUp = level > (current?.level ?? 0)

        // Calculate streak
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = localDate(yesterday, user.timezone || 'UTC')
        const [yesterdayRow] = await tx.select().from(dailyStats).where(and(
          eq(dailyStats.userId, user.id),
          eq(dailyStats.localDate, yesterdayStr),
        )).limit(1)
        const prevStreak = current?.currentStreak ?? 0
        const newStreak = yesterdayRow ? prevStreak + 1 : 1
        const newLongestStreak = Math.max(current?.longestStreak ?? 0, newStreak)

        await tx.insert(userStats).values({
          userId: user.id,
          totalTests: 1,
          totalWords: metrics.wordsTyped,
          totalChars: metrics.charsCorrect + metrics.charsIncorrect,
          totalTimeMs: Math.round(metrics.durationMs),
          xp: nextXp,
          level,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastActiveDate: local,
        }).onConflictDoUpdate({
          target: userStats.userId,
          set: {
            totalTests: sql`${userStats.totalTests} + 1`,
            totalWords: sql`${userStats.totalWords} + ${metrics.wordsTyped}`,
            totalChars: sql`${userStats.totalChars} + ${metrics.charsCorrect + metrics.charsIncorrect}`,
            totalTimeMs: sql`${userStats.totalTimeMs} + ${Math.round(metrics.durationMs)}`,
            xp: nextXp,
            level,
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastActiveDate: local,
            updatedAt: new Date(),
          },
        })

        const languageCode = input.config.contentType === 'code' ? input.config.codeLanguage : input.config.language
        await tx.insert(userLanguageStats).values({
          userId: user.id,
          language: languageCode,
          xp,
          level: levelFromXp(xp),
          totalTests: 1,
          totalWords: metrics.wordsTyped,
          totalTimeMs: Math.round(metrics.durationMs),
        }).onConflictDoUpdate({
          target: [userLanguageStats.userId, userLanguageStats.language],
          set: {
            xp: sql`${userLanguageStats.xp} + ${xp}`,
            totalTests: sql`${userLanguageStats.totalTests} + 1`,
            totalWords: sql`${userLanguageStats.totalWords} + ${metrics.wordsTyped}`,
            totalTimeMs: sql`${userLanguageStats.totalTimeMs} + ${Math.round(metrics.durationMs)}`,
            updatedAt: new Date(),
          },
        })

        if (status === 'valid') {
          const [pb] = await tx.select().from(personalBests).where(and(
            eq(personalBests.userId, user.id),
            eq(personalBests.configKey, configKey),
          )).limit(1)

          if (!pb || Number(pb.wpm) < metrics.wpm) {
            isPB = true
            await tx.insert(personalBests).values({
              userId: user.id,
              configKey,
              wpm: metrics.wpm.toFixed(2),
              accuracy: metrics.accuracy.toFixed(2),
              testId: input.testId,
            }).onConflictDoUpdate({
              target: [personalBests.userId, personalBests.configKey],
              set: {
                wpm: metrics.wpm.toFixed(2),
                accuracy: metrics.accuracy.toFixed(2),
                testId: input.testId,
                achievedAt: new Date(),
              },
            })
          }
        }

        // Evaluate dynamic achievements
        const existingAch = await tx.select({ id: userAchievements.achievementId })
          .from(userAchievements)
          .where(eq(userAchievements.userId, user.id))
        const unlockedIds = new Set(existingAch.map(a => a.id))

        if (!unlockedIds.has('first-test')) newAchievements.push('first-test')
        if (!unlockedIds.has('wpm-40') && metrics.wpm >= 40) newAchievements.push('wpm-40')
        if (!unlockedIds.has('wpm-60') && metrics.wpm >= 60) newAchievements.push('wpm-60')
        if (!unlockedIds.has('wpm-80') && metrics.wpm >= 80) newAchievements.push('wpm-80')
        if (!unlockedIds.has('wpm-100') && metrics.wpm >= 100) newAchievements.push('wpm-100')
        if (!unlockedIds.has('wpm-120') && metrics.wpm >= 120) newAchievements.push('wpm-120')
        if (!unlockedIds.has('streak-7') && newStreak >= 7) newAchievements.push('streak-7')
        if (!unlockedIds.has('streak-30') && newStreak >= 30) newAchievements.push('streak-30')
        if (!unlockedIds.has('streak-100') && newStreak >= 100) newAchievements.push('streak-100')
        if (!unlockedIds.has('words-1k') && (current?.totalWords ?? 0) + metrics.wordsTyped >= 1000) newAchievements.push('words-1k')
        if (!unlockedIds.has('words-10k') && (current?.totalWords ?? 0) + metrics.wordsTyped >= 10000) newAchievements.push('words-10k')
        if (!unlockedIds.has('words-100k') && (current?.totalWords ?? 0) + metrics.wordsTyped >= 100000) newAchievements.push('words-100k')
        if (!unlockedIds.has('perfectionist') && metrics.accuracy >= 100 && metrics.durationMs >= 60000) newAchievements.push('perfectionist')
        if (!unlockedIds.has('marathoner') && metrics.durationMs >= 300000) newAchievements.push('marathoner')

        const currentHour = new Date().getUTCHours()
        if (!unlockedIds.has('night-owl') && currentHour >= 0 && currentHour <= 4) newAchievements.push('night-owl')

        if (newAchievements.length) {
          await tx.insert(userAchievements).values(
            newAchievements.map(id => ({ userId: user.id, achievementId: id, testId: input.testId })),
          ).onConflictDoNothing()
        }
      }
    })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : ''
    if (message.includes('duplicate key')) throw createError({ statusCode: 409, statusMessage: 'Test already submitted' })
    throw cause
  }

  const ranks: { daily: number | null; weekly: number | null } = { daily: null, weekly: null }
  if (inserted && status === 'valid') {
    const redis = getRedis()
    if (redis) {
      try {
        const configKeyValue = configKey
        await Promise.all([
          redis.zadd(buildLeaderboardKey('daily', periodId('daily'), configKeyValue), { gt: true }, { score: encodeScore(metrics.wpm, metrics.accuracy), member: user.id }),
          redis.zadd(buildLeaderboardKey('weekly', periodId('weekly'), configKeyValue), { gt: true }, { score: encodeScore(metrics.wpm, metrics.accuracy), member: user.id }),
          redis.zadd(buildLeaderboardKey('alltime', periodId('alltime'), configKeyValue), { gt: true }, { score: encodeScore(metrics.wpm, metrics.accuracy), member: user.id }),
          redis.zincrby(buildXpKey('daily', periodId('daily'), 'global'), xp, user.id),
          redis.zincrby(buildXpKey('weekly', periodId('weekly'), 'global'), xp, user.id),
          redis.zincrby(buildXpKey('alltime', periodId('alltime'), 'global'), xp, user.id),
          redis.hset(`user:${user.id}`, { username: user.username ?? user.name, avatar: '', level, date: local }),
        ])
        const [dailyRank, weeklyRank] = await Promise.all([
          redis.zrank(buildLeaderboardKey('daily', periodId('daily'), configKeyValue), user.id),
          redis.zrank(buildLeaderboardKey('weekly', periodId('weekly'), configKeyValue), user.id),
        ])
        ranks.daily = dailyRank === null ? null : dailyRank + 1
        ranks.weekly = weeklyRank === null ? null : weeklyRank + 1
      } catch {
        // leaderboard writes are best-effort; Postgres remains the source of truth
      }
    }
  }

  return {
    testId: input.testId,
    result: metrics,
    isPB,
    xpGained: xp,
    level,
    levelUp,
    newAchievements,
    ranks,
  }
})


