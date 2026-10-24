import type { Keystroke } from '#shared/types/test'

export interface AntiCheatInput {
  wpm: number
  accuracy: number
  durationMs: number
  keystrokes: Keystroke[]
  claimedWpm?: number
}

export interface AntiCheatVerdict {
  status: 'valid' | 'flagged'
  reasons: string[]
}

export function assessTest(input: AntiCheatInput): AntiCheatVerdict {
  const reasons: string[] = []

  if (input.wpm > 250) reasons.push('wpm-too-high')
  if (input.accuracy > 100 || input.accuracy < 0) reasons.push('accuracy-out-of-range')
  if (input.durationMs <= 0) reasons.push('no-duration')

  if (input.claimedWpm !== undefined && input.wpm > 0) {
    const delta = Math.abs(input.wpm - input.claimedWpm) / input.wpm
    if (delta > 0.01) reasons.push('metric-mismatch')
  }

  const intervals: number[] = []
  for (let i = 1; i < input.keystrokes.length; i++) {
    intervals.push(input.keystrokes[i]!.t - input.keystrokes[i - 1]!.t)
  }

  const fastIntervals = intervals.filter(interval => interval >= 0 && interval < 10)
  if (intervals.length > 30 && fastIntervals.length / intervals.length > 0.2) reasons.push('bot-intervals')

  if (intervals.length > 20) {
    const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length
    const variance = intervals.reduce((sum, value) => sum + (value - mean) ** 2, 0) / intervals.length
    if (mean > 0 && Math.sqrt(variance) / mean < 0.02) reasons.push('too-regular')
  }

  return { status: reasons.length ? 'flagged' : 'valid', reasons }
}

export function hardReject(wpm: number): boolean {
  return wpm > 350
}
