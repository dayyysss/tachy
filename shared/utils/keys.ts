import type { TestConfig } from '#shared/config/modes'
import type { LeaderboardPeriod } from '#shared/config/leaderboard'

export function buildConfigKey(input: {
  language: string
  contentType: string
  mode: string
  amount: number
  punctuation?: boolean
  numbers?: boolean
}): string {
  const modifiers = [
    input.punctuation ? 'p' : '',
    input.numbers ? 'n' : '',
  ].filter(Boolean).join('')
  const suffix = modifiers ? `:${modifiers}` : ''
  return `${input.language}:${input.contentType}:${input.mode}:${input.amount}${suffix}`
}

export function configKeyFromTest(config: TestConfig): string {
  return buildConfigKey({
    language: config.contentType === 'code' ? config.codeLanguage : config.language,
    contentType: config.contentType,
    mode: config.mode,
    amount: config.amount,
    punctuation: config.punctuation,
    numbers: config.numbers,
  })
}

export function buildLeaderboardKey(period: LeaderboardPeriod, periodId: string, configKey: string): string {
  return `lb:wpm:${period}:${periodId}:${configKey}`
}

export function buildXpKey(period: LeaderboardPeriod, periodId: string, scope: string): string {
  return `lb:xp:${period}:${periodId}:${scope}`
}

export function encodeScore(wpm: number, accuracy: number): number {
  return Math.round(wpm * 100) * 100000 + Math.round(accuracy * 100)
}
