import { xpConfig, levelFromXp } from '#shared/config/xp'

export interface XpInput {
  correctChars: number
  accuracy: number
  wpm: number
  punctuation?: boolean
  numbers?: boolean
  code?: boolean
  dailyChallenge?: boolean
  xpToday?: number
}

export function computeXp(input: XpInput): number {
  const baseXp = input.correctChars / xpConfig.charsPerWord
  const accuracyFactor = Math.pow(Math.max(0, Math.min(100, input.accuracy)) / 100, 2)
  const speedFactor = 1 + Math.min(input.wpm, xpConfig.maxSpeedWpm) / xpConfig.maxSpeedWpm
  const bonus =
    (input.punctuation ? xpConfig.bonusPunctuation : 0) +
    (input.numbers ? xpConfig.bonusNumbers : 0) +
    (input.code ? xpConfig.bonusCode : 0) +
    (input.dailyChallenge ? xpConfig.bonusDaily : 0)

  let xp = Math.round(baseXp * accuracyFactor * speedFactor * (1 + bonus))

  const already = input.xpToday ?? 0
  if (already >= xpConfig.dailySoftCap) xp = Math.round(xp * xpConfig.softCapMultiplier)
  else if (already + xp > xpConfig.dailySoftCap) {
    const over = already + xp - xpConfig.dailySoftCap
    xp = xpConfig.dailySoftCap - already + Math.round(over * xpConfig.softCapMultiplier)
  }

  return Math.max(0, xp)
}

export { levelFromXp }
