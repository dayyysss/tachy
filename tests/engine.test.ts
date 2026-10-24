import { describe, expect, it } from 'vitest'
import { TypingSession, replaySession } from '#shared/utils/engine'
import { computeMetrics } from '#shared/utils/metrics'

describe('typing engine', () => {
  it('counts correct characters and spaces for perfect words', () => {
    const session = new TypingSession(['hello', 'world'])
    for (const char of 'hello world') {
      session.press(char, 0)
    }
    const metrics = session.snapshot(60000)
    expect(metrics.charsCorrect).toBe(11)
    expect(metrics.charsIncorrect).toBe(0)
    expect(metrics.wordsTyped).toBe(1)
    expect(metrics.wpm).toBeCloseTo(2.2, 1)
  })

  it('ignores a space on an empty word and supports backspace', () => {
    const session = new TypingSession(['ab'])
    session.press(' ', 0)
    expect(session.cursorWord).toBe(0)
    session.press('a', 1)
    session.press('x', 2)
    session.press('Backspace', 3)
    session.press('b', 4)
    expect(session.typedWords[0]).toBe('ab')
    expect(session.keystrokes.filter(key => key.key !== 'Backspace')).toHaveLength(3)
  })

  it('replays a keystroke log deterministically', () => {
    const keys = [
      { t: 0, key: 'a', correct: true },
      { t: 100, key: 'b', correct: true },
      { t: 200, key: ' ', correct: true },
    ]
    const session = replaySession(['ab', 'cd'], keys)
    expect(session.typedWords).toEqual(['ab', ''])
    expect(session.cursorWord).toBe(1)
    expect(session.finished).toBe(true)
  })

  it('computes accuracy from keypresses, including corrected mistakes', () => {
    const metrics = computeMetrics({
      targetWords: ['ab'],
      typedWords: ['ab'],
      cursorWord: 0,
      keystrokes: [
        { t: 0, key: 'a', correct: true },
        { t: 100, key: 'x', correct: false },
        { t: 200, key: 'b', correct: true },
      ],
      startedAt: 0,
      now: 60000,
      finishedAt: null,
    })
    expect(metrics.accuracy).toBeCloseTo(66.67, 1)
  })
})

