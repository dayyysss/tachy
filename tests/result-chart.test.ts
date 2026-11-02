import { describe, it, expect } from 'vitest'
import Chart from 'chart.js/auto'
import type { WpmPoint } from '#shared/types/test'

describe('ResultChart data formatting', () => {
  const sampleSeries: WpmPoint[] = [
    { second: 1, wpm: 60, raw: 65, errors: 0 },
    { second: 2, wpm: 75, raw: 80, errors: 1 },
    { second: 3, wpm: 72, raw: 78, errors: 0 },
    { second: 4, wpm: 84, raw: 90, errors: 2 },
  ]

  it('generates correct labels and series data', () => {
    const labels = sampleSeries.map(p => `${p.second}`)
    const wpmData = sampleSeries.map(p => p.wpm)
    const rawData = sampleSeries.map(p => p.raw)
    const errorData = sampleSeries.map(p => p.errors > 0 ? p.errors : null)

    expect(labels).toEqual(['1', '2', '3', '4'])
    expect(wpmData).toEqual([60, 75, 72, 84])
    expect(rawData).toEqual([65, 80, 78, 90])
    expect(errorData).toEqual([null, 1, null, 2])
  })

  it('calculates telemetry summary stats correctly', () => {
    const peakWpm = Math.max(...sampleSeries.map(p => p.wpm), 0)
    const peakRaw = Math.max(...sampleSeries.map(p => p.raw), 0)
    const totalErrors = sampleSeries.reduce((acc, p) => acc + p.errors, 0)

    expect(peakWpm).toBe(84)
    expect(peakRaw).toBe(90)
    expect(totalErrors).toBe(3)
  })

  it('safely handles 1-point and empty series', () => {
    const single: WpmPoint[] = [{ second: 1, wpm: 50, raw: 55, errors: 0 }]
    const preparedSingle = [{ second: 0, wpm: 0, raw: 0, errors: 0 }, single[0]!]
    expect(preparedSingle).toHaveLength(2)
    expect(preparedSingle[0]?.second).toBe(0)
    expect(preparedSingle[1]?.wpm).toBe(50)

    const empty: WpmPoint[] = []
    const preparedEmpty = [{ second: 0, wpm: 0, raw: 0, errors: 0 }, { second: 1, wpm: 0, raw: 0, errors: 0 }]
    expect(preparedEmpty).toHaveLength(2)
  })
})
