import type { ContentType, Mode } from './modes'

export interface RankedPreset {
  contentType: ContentType
  mode: Mode
  amounts: number[]
}

export const rankedPresets: RankedPreset[] = [
  { contentType: 'words', mode: 'time', amounts: [15, 30, 60, 120] },
  { contentType: 'words', mode: 'words', amounts: [25, 50, 100] },
  { contentType: 'numbers', mode: 'time', amounts: [30, 60] },
  { contentType: 'quotes', mode: 'quote', amounts: [] },
  { contentType: 'code', mode: 'code', amounts: [] },
]

export const leaderboardPeriods = ['daily', 'weekly', 'alltime'] as const
export type LeaderboardPeriod = (typeof leaderboardPeriods)[number]

export const LEADERBOARD_TZ = 'UTC'

export const eligibility = {
  minAccuracy: 90,
  minTimeSeconds: 15,
  minWords: 25,
} as const

export function isRankedPreset(contentType: ContentType, mode: Mode, amount: number): boolean {
  return rankedPresets.some(preset =>
    preset.contentType === contentType &&
    preset.mode === mode &&
    (preset.amounts.length === 0 || preset.amounts.includes(amount)),
  )
}
