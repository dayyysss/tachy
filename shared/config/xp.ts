export const xpConfig = {
  charsPerWord: 5,
  maxSpeedWpm: 150,
  bonusPunctuation: 0.1,
  bonusNumbers: 0.1,
  bonusCode: 0.2,
  bonusDaily: 0.5,
  dailySoftCap: 1500,
  softCapMultiplier: 0.5,
  levelDivisor: 50,
} as const

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / xpConfig.levelDivisor))
}

export function xpForLevel(level: number): number {
  return level * level * xpConfig.levelDivisor
}
