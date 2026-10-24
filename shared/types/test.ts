import type { QuoteLength, TestConfig } from '#shared/config/modes'

export interface Keystroke {
  t: number
  key: string
  correct: boolean
}

export interface WpmPoint {
  second: number
  wpm: number
  raw: number
  errors: number
}

export interface Metrics {
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  charsCorrect: number
  charsIncorrect: number
  charsExtra: number
  charsMissed: number
  wordsTyped: number
  durationMs: number
  series: WpmPoint[]
}

export interface TestResult extends Metrics {
  id: string
  config: TestConfig
  seed: string
  startedAt: number
  finishedAt: number
  keystrokes: Keystroke[]
  targetWords: string[]
  typedWords: string[]
  isDailyChallenge?: boolean
}

export interface HistoryEntry {
  id: string
  createdAt: number
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  language: string
  contentType: string
  mode: string
  amount: number
  durationMs: number
  wordsTyped: number
}

export interface LeaderboardRow {
  rank: number
  userId: string
  username: string
  avatar?: string | null
  level: number
  wpm: number
  accuracy: number
  date: string
}

export interface PublicStats {
  tests: number
  words: number
  timeMs: number
  users: number
}

export interface QuoteEntry {
  text: string
  source: string
  license: string
}

export type { TestConfig, QuoteLength }
