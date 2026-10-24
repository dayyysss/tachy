import type { Keystroke, Metrics, WpmPoint } from '#shared/types/test'

export interface MetricsInput {
  targetWords: string[]
  typedWords: string[]
  cursorWord: number
  keystrokes: Keystroke[]
  startedAt: number
  now: number
  finishedAt: number | null
}

export function computeChars(targetWords: string[], typedWords: string[], cursorWord: number) {
  let correct = 0
  let incorrect = 0
  let extra = 0
  let missed = 0

  for (let i = 0; i < targetWords.length; i++) {
    const target = targetWords[i]!
    const typed = typedWords[i]
    if (typed === undefined) break

    const compared = Math.min(target.length, typed.length)
    for (let c = 0; c < compared; c++) {
      if (typed[c] === target[c]) correct++
      else incorrect++
    }

    if (typed.length > target.length) extra += typed.length - target.length

    const completed = i < cursorWord
    if (completed) {
      if (typed.length < target.length) missed += target.length - typed.length
      if (typed === target) correct++
    }
  }

  return { correct, incorrect, extra, missed }
}

function emptySeries(): WpmPoint[] {
  return []
}

export function computeSeries(keystrokes: Keystroke[], durationMs: number): WpmPoint[] {
  if (!keystrokes.length || durationMs <= 0) return emptySeries()

  const seconds = Math.max(1, Math.ceil(durationMs / 1000))
  const perSecondChars = new Array<number>(seconds).fill(0)
  const perSecondErrors = new Array<number>(seconds).fill(0)

  for (const keystroke of keystrokes) {
    if (keystroke.key === 'Backspace' || keystroke.key === 'Tab') continue
    const index = Math.min(seconds - 1, Math.max(0, Math.floor(keystroke.t / 1000)))
    if (keystroke.key === ' ') perSecondChars[index]! += 1
    else if (keystroke.key === '\n') perSecondChars[index]! += 1
    else perSecondChars[index]! += 1
    if (!keystroke.correct) perSecondErrors[index]! += 1
  }

  let cumulativeChars = 0
  let cumulativeErrors = 0
  const points: WpmPoint[] = []

  for (let second = 0; second < seconds; second++) {
    cumulativeChars += perSecondChars[second]!
    cumulativeErrors += perSecondErrors[second]!
    const minutes = (second + 1) / 60
    points.push({
      second: second + 1,
      raw: Math.round((perSecondChars[second]! / 5) * 60 * 100) / 100,
      wpm: Math.round(((Math.max(0, cumulativeChars - cumulativeErrors) / 5) / minutes) * 100) / 100,
      errors: perSecondErrors[second]!,
    })
  }

  return points
}

export function computeConsistency(series: WpmPoint[]): number {
  const values = series.map(point => point.raw).filter(value => value > 0)
  if (values.length < 2) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  if (mean <= 0) return 0
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  const stdev = Math.sqrt(variance)
  return Math.max(0, Math.min(100, Math.round((1 - stdev / mean) * 10000) / 100))
}

export function computeMetrics(input: MetricsInput): Metrics {
  const { targetWords, typedWords, cursorWord, keystrokes, startedAt, now, finishedAt } = input
  const end = finishedAt ?? now
  const durationMs = Math.max(0, end - startedAt)
  const minutes = durationMs / 60000
  const chars = computeChars(targetWords, typedWords, cursorWord)

  const printable = keystrokes.filter(keystroke => keystroke.key !== 'Backspace' && keystroke.key !== 'Tab')
  const correctPresses = printable.filter(keystroke => keystroke.correct).length
  const accuracy = printable.length ? (correctPresses / printable.length) * 100 : 100

  const correctChars = chars.correct
  const allChars = chars.correct + chars.incorrect + chars.extra
  const wpm = minutes > 0 ? (correctChars / 5) / minutes : 0
  const rawWpm = minutes > 0 ? (allChars / 5) / minutes : 0
  const series = computeSeries(printable, durationMs)

  return {
    wpm: Math.round(wpm * 100) / 100,
    rawWpm: Math.round(rawWpm * 100) / 100,
    accuracy: Math.round(accuracy * 100) / 100,
    consistency: computeConsistency(series),
    charsCorrect: chars.correct,
    charsIncorrect: chars.incorrect,
    charsExtra: chars.extra,
    charsMissed: chars.missed,
    wordsTyped: Math.max(0, cursorWord),
    durationMs,
    series,
  }
}
