import { describe, expect, it } from 'vitest'
import { generateTestText, createRng } from '#shared/utils/generator'
import { computeXp, levelFromXp } from '#shared/utils/xp'
import { buildConfigKey, encodeScore } from '#shared/utils/keys'
import { assessTest } from '#shared/utils/antiCheat'
import { defaultConfig } from '#shared/config/modes'
import { sanitizeSvg } from '../server/utils/sanitizeSvg'

describe('generator', () => {
  it('is deterministic for the same seed', () => {
    const a = generateTestText({ ...defaultConfig, mode: 'words', amount: 10 }, 'seed-1')
    const b = generateTestText({ ...defaultConfig, mode: 'words', amount: 10 }, 'seed-1')
    expect(a.words).toEqual(b.words)
    expect(a.words).toHaveLength(10)
  })

  it('produces different text for different seeds', () => {
    const a = generateTestText({ ...defaultConfig, mode: 'words', amount: 10 }, 'seed-1')
    const b = generateTestText({ ...defaultConfig, mode: 'words', amount: 10 }, 'seed-2')
    expect(a.words).not.toEqual(b.words)
  })

  it('walks the list in sequential order', () => {
    const first = generateTestText({ ...defaultConfig, mode: 'words', amount: 3, order: 'sequential' }, 'seed', 0)
    const second = generateTestText({ ...defaultConfig, mode: 'words', amount: 3, order: 'sequential' }, 'seed', first.nextPosition)
    expect(first.words[0]).not.toBe(second.words[0])
  })

  it('changes punctuation and numbers output', () => {
    const plain = generateTestText({ ...defaultConfig, mode: 'words', amount: 20 }, 'seed')
    const modified = generateTestText({ ...defaultConfig, mode: 'words', amount: 20, punctuation: true, numbers: true }, 'seed')
    expect(modified.words.join(' ')).not.toBe(plain.words.join(' '))
  })

  it('creates stable rng values', () => {
    const a = createRng('abc')
    const b = createRng('abc')
    expect(a()).toBe(b())
  })

  it('uses custom text verbatim', () => {
    const generated = generateTestText({ ...defaultConfig, mode: 'custom', customText: 'alpha beta gamma' }, 'seed')
    expect(generated.words).toEqual(['alpha', 'beta', 'gamma'])
    expect(generated.source).toBe('custom')
  })

  it('generates a long zen stream', () => {
    const generated = generateTestText({ ...defaultConfig, mode: 'zen', contentType: 'zen', amount: 0 }, 'seed')
    expect(generated.words.length).toBeGreaterThanOrEqual(100)
  })
})

describe('xp', () => {
  it('levels follow the square-root formula', () => {
    expect(levelFromXp(0)).toBe(0)
    expect(levelFromXp(50)).toBe(1)
    expect(levelFromXp(1250)).toBe(5)
    expect(levelFromXp(5000)).toBe(10)
  })

  it('applies the daily soft cap', () => {
    const normal = computeXp({ correctChars: 300, accuracy: 100, wpm: 60 })
    const capped = computeXp({ correctChars: 300, accuracy: 100, wpm: 60, xpToday: 1500 })
    expect(capped).toBeLessThan(normal)
    expect(capped).toBe(Math.round(normal * 0.5))
  })
})

describe('keys', () => {
  it('builds stable config keys', () => {
    expect(buildConfigKey({ language: 'en', contentType: 'words', mode: 'time', amount: 60 })).toBe('en:words:time:60')
    expect(buildConfigKey({ language: 'en', contentType: 'words', mode: 'time', amount: 60, punctuation: true })).toBe('en:words:time:60:p')
  })

  it('encodes wpm first and accuracy as tie-breaker', () => {
    expect(encodeScore(80, 99)).toBeGreaterThan(encodeScore(79, 100))
  })
})

describe('anti-cheat', () => {
  it('flags impossible speed', () => {
    const verdict = assessTest({ wpm: 300, accuracy: 100, durationMs: 60000, keystrokes: [] })
    expect(verdict.status).toBe('flagged')
  })

  it('accepts a normal result', () => {
    const verdict = assessTest({ wpm: 80, accuracy: 97, durationMs: 60000, keystrokes: [] })
    expect(verdict.status).toBe('valid')
  })

  it('flags bot-like intervals', () => {
    const keystrokes = Array.from({ length: 60 }, (_, index) => ({ t: index * 5, key: 'a', correct: true }))
    const verdict = assessTest({ wpm: 120, accuracy: 100, durationMs: 30000, keystrokes })
    expect(verdict.reasons).toContain('bot-intervals')
  })
})

describe('svg sanitizer', () => {
  it('removes scripts and inline handlers', () => {
    const clean = sanitizeSvg('<svg onload="alert(1)"><script>alert(2)</script><rect fill="red"/></svg>')
    expect(clean).not.toContain('script')
    expect(clean).not.toContain('onload')
    expect(clean).toContain('<rect')
  })
})

describe('wordlists and code languages', () => {
  it('contains 1000 words each for EN and ID', async () => {
    const en = (await import('#shared/data/words/en.json')).default
    const id = (await import('#shared/data/words/id.json')).default
    expect(en.length).toBe(1000)
    expect(id.length).toBe(1000)
  })

  it('generates text for all 15 natural languages', async () => {
    const { availableLanguages } = await import('#shared/config/languages')
    expect(availableLanguages.length).toBe(15)

    for (const lang of availableLanguages) {
      const result = generateTestText({ ...defaultConfig, language: lang.code, mode: 'words', amount: 5 }, `seed-${lang.code}`)
      expect(result.words.length).toBe(5)
    }
  })

  it('generates code for all 22 programming languages', async () => {
    const { codeLanguages } = await import('#shared/config/languages')
    expect(codeLanguages.length).toBe(22)

    for (const code of codeLanguages) {
      const result = generateTestText({ ...defaultConfig, mode: 'code', contentType: 'code', codeLanguage: code.code }, `seed-${code.code}`)
      expect(result.words.length).toBeGreaterThan(0)
      expect(result.source).toBe(code.code)
    }
  })
})

describe('theme contrast', () => {
  it('ensures default tachy theme meets WCAG contrast >= 4.5:1', async () => {
    const { getTheme, defaultTheme } = await import('#shared/config/themes')
    const theme = getTheme(defaultTheme)
    expect(theme.recommended).toBe(true)
    expect(theme.contrastWarning).toBeUndefined()
  })
})

describe('toast composable', () => {
  it('adds and removes toasts with correct types', async () => {
    const { useToast } = await import('../app/composables/useToast')
    const toast = useToast()
    const id = toast.success('Test success message', 0)
    expect(toast.toasts.value.some(t => t.id === id && t.type === 'success')).toBe(true)
    toast.error('Test error message', 0)
    expect(toast.toasts.value.some(t => t.type === 'error')).toBe(true)
    toast.remove(id)
    expect(toast.toasts.value.some(t => t.id === id)).toBe(false)
  })
})

