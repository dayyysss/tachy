import type { Keystroke, Metrics } from '#shared/types/test'
import { computeMetrics } from './metrics'

export class TypingSession {
  readonly targetWords: string[]
  typedWords: string[] = ['']
  cursorWord = 0
  keystrokes: Keystroke[] = []
  startedAt = 0
  endedAt: number | null = null
  finished = false
  started = false

  constructor(targetWords: string[]) {
    this.targetWords = targetWords
  }

  private currentTarget(): string {
    return this.targetWords[this.cursorWord] ?? ''
  }

  press(key: string, t: number): void {
    if (this.finished) return

    if (key === 'Backspace') {
      const current = this.typedWords[this.cursorWord] ?? ''
      if (current.length > 0) {
        this.typedWords[this.cursorWord] = current.slice(0, -1)
      } else if (this.cursorWord > 0) {
        this.cursorWord--
        this.typedWords.pop()
      }
      return
    }

    if (key === ' ' || key === '\n') {
      const current = this.typedWords[this.cursorWord] ?? ''
      if (current.length === 0) return
      this.markStart(t)
      this.keystrokes.push({ t, key: ' ', correct: current === this.currentTarget() })
      this.typedWords.push('')
      this.cursorWord++
      if (this.cursorWord >= this.targetWords.length) this.finish(t)
      return
    }

    if (key.length !== 1) return

    this.markStart(t)
    const typed = (this.typedWords[this.cursorWord] ?? '') + key
    if (typed.length > this.currentTarget().length + 24) return
    this.typedWords[this.cursorWord] = typed
    this.keystrokes.push({ t, key, correct: key === this.currentTarget()[typed.length - 1] })
  }

  private markStart(t: number): void {
    if (this.started) return
    this.started = true
    this.startedAt = t
  }

  finish(t: number): void {
    if (this.finished) return
    this.finished = true
    this.endedAt = t
  }

  snapshot(now: number): Metrics {
    return computeMetrics({
      targetWords: this.targetWords,
      typedWords: this.typedWords,
      cursorWord: this.cursorWord,
      keystrokes: this.keystrokes,
      startedAt: this.startedAt,
      now,
      finishedAt: this.endedAt,
    })
  }
}

export function replaySession(targetWords: string[], keystrokes: Keystroke[]): TypingSession {
  const session = new TypingSession(targetWords)
  for (const keystroke of keystrokes) {
    session.press(keystroke.key, keystroke.t)
  }
  const last = keystrokes[keystrokes.length - 1]
  if (last) session.finish(last.t)
  return session
}
