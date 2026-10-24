import type { TestConfig } from '#shared/config/modes'
import type { QuoteEntry } from '#shared/types/test'
import enWords from '#shared/data/words/en.json'
import idWords from '#shared/data/words/id.json'
import enQuotes from '#shared/data/quotes/en.json'
import idQuotes from '#shared/data/quotes/id.json'
import jsCode from '#shared/data/code/js.json'
import tsCode from '#shared/data/code/ts.json'
import pyCode from '#shared/data/code/py.json'
import phpCode from '#shared/data/code/php.json'
import goCode from '#shared/data/code/go.json'
import rustCode from '#shared/data/code/rust.json'
import javaCode from '#shared/data/code/java.json'
import cppCode from '#shared/data/code/cpp.json'
import cssCode from '#shared/data/code/css.json'
import sqlCode from '#shared/data/code/sql.json'
import htmlCode from '#shared/data/code/html.json'

const wordlists: Record<string, string[]> = { en: enWords, id: idWords }
const quotes: Record<string, QuoteEntry[]> = { en: enQuotes, id: idQuotes }
const codeSamples: Record<string, string[]> = { js: jsCode, ts: tsCode, py: pyCode, php: phpCode, go: goCode, rust: rustCode, java: javaCode, cpp: cppCode, sql: sqlCode, html: htmlCode, css: cssCode }

export function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createRng(seed: string): () => number {
  let state = hashSeed(seed)
  return () => {
    state |= 0
    state = (state + 0x6D2B79F5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]!
}

function applyPunctuation(words: string[], rng: () => number): string[] {
  const marks = ['.', ',', '?', '!', ';', ':']

  return words.map((word, index) => {
    if (index === 0) return word[0]!.toUpperCase() + word.slice(1)
    const mark = marks[Math.floor(rng() * marks.length)]!
    if (index % 9 === 0) return word + mark
    if (index % 9 === 1) return word[0]!.toUpperCase() + word.slice(1)
    if (index % 13 === 0) return word + mark
    return word
  })
}

function applyNumbers(words: string[], rng: () => number): string[] {
  return words.map((word, index) => {
    if (index > 0 && index % 7 === 0) {
      const digits = 1 + Math.floor(rng() * 3)
      let value = ''
      for (let i = 0; i < digits; i++) value += Math.floor(rng() * 10)
      return value
    }
    return word
  })
}

export function generateWords(config: TestConfig, seed: string, position = 0): { words: string[]; nextPosition: number } {
  const list = wordlists[config.language] ?? wordlists.en!
  const rng = createRng(seed)
  const count = config.mode === 'time' ? Math.max(80, config.amount * 4)
    : config.mode === 'zen' ? 150
    : Math.min(500, Math.max(1, config.amount))
  const words: string[] = []

  if (config.order === 'sequential') {
    for (let i = 0; i < count; i++) {
      words.push(list[(position + i) % list.length]!)
    }
    return { words, nextPosition: (position + count) % list.length }
  }

  let previous = ''
  for (let i = 0; i < count; i++) {
    let word = pick(list, rng)
    let guard = 0
    while (word === previous && guard < 8) {
      word = pick(list, rng)
      guard++
    }
    previous = word
    words.push(word)
  }

  const withNumbers = config.numbers ? applyNumbers(words, rng) : words
  const finalWords = config.punctuation ? applyPunctuation(withNumbers, rng) : withNumbers
  return { words: finalWords, nextPosition: 0 }
}

export function generateQuote(config: TestConfig, seed: string): { words: string[]; source: string } {
  const list = quotes[config.language] ?? quotes.en!
  const rng = createRng(seed)
  const filtered = list.filter(quote => {
    if (config.quoteLength === 'short') return quote.text.length < 100
    if (config.quoteLength === 'medium') return quote.text.length >= 100 && quote.text.length <= 300
    if (config.quoteLength === 'long') return quote.text.length > 300
    return true
  })
  const quote = pick(filtered.length ? filtered : list, rng)
  return { words: quote.text.split(/\s+/), source: quote.source }
}

export function generateCode(config: TestConfig, seed: string): { words: string[]; source: string } {
  const samples = codeSamples[config.codeLanguage] ?? codeSamples.js!
  const rng = createRng(seed)
  const sized = samples.filter(sample => {
    if (config.codeLength === 'short') return sample.length < 100
    if (config.codeLength === 'long') return sample.length > 180
    return sample.length >= 100 && sample.length <= 180
  })
  const sample = pick(sized.length ? sized : samples, rng)
  return { words: sample.replace(/\s*\n\s*/g, ' ').split(/\s+/), source: config.codeLanguage }
}

export interface GeneratedText {
  words: string[]
  nextPosition: number
  source: string
}

export function generateCustom(config: TestConfig): GeneratedText {
  const words = (config.customText ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 3000)
  return { words: words.length ? words : ['type'], nextPosition: 0, source: 'custom' }
}

export function generateTestText(config: TestConfig, seed: string, position = 0): GeneratedText {
  if (config.mode === 'custom') return generateCustom(config)

  if (config.contentType === 'quotes' || config.mode === 'quote') {
    const quote = generateQuote(config, seed)
    return { words: quote.words, nextPosition: 0, source: quote.source }
  }

  if (config.contentType === 'code' || config.mode === 'code') {
    const code = generateCode(config, seed)
    return { words: code.words, nextPosition: 0, source: code.source }
  }

  if (config.contentType === 'numbers') {
    const rng = createRng(seed)
    const count = config.mode === 'time' ? Math.max(80, config.amount * 4) : config.amount
    const words: string[] = []
    for (let i = 0; i < count; i++) {
      let token = ''
      const digits = 1 + Math.floor(rng() * 4)
      for (let d = 0; d < digits; d++) token += Math.floor(rng() * 10)
      words.push(token)
    }
    return { words, nextPosition: 0, source: 'numbers' }
  }

  const generated = generateWords(config, seed, position)
  return { words: generated.words, nextPosition: generated.nextPosition, source: config.language }
}

export function dailySeed(date: string, language: string): string {
  return `daily:${date}:${language}`
}
