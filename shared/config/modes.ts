export const contentTypes = ['words', 'numbers', 'quotes', 'code', 'zen'] as const
export type ContentType = (typeof contentTypes)[number]

export const modes = ['time', 'words', 'quote', 'code', 'zen', 'custom'] as const
export type Mode = (typeof modes)[number]

export const orders = ['random', 'sequential'] as const
export type Order = (typeof orders)[number]

export const timeOptions = [15, 30, 60, 120] as const
export const wordAmounts = [10, 25, 50, 100] as const
export const quoteLengths = ['short', 'medium', 'long', 'any'] as const
export type QuoteLength = (typeof quoteLengths)[number]

export const codeLengths = ['short', 'medium', 'long'] as const
export type CodeLength = (typeof codeLengths)[number]

export interface TestConfig {
  contentType: ContentType
  mode: Mode
  amount: number
  language: string
  codeLanguage: string
  punctuation: boolean
  numbers: boolean
  order: Order
  quoteLength: QuoteLength
  codeLength: CodeLength
  customText?: string
}

export const defaultConfig: TestConfig = {
  contentType: 'words',
  mode: 'time',
  amount: 30,
  language: 'en',
  codeLanguage: 'js',
  punctuation: false,
  numbers: false,
  order: 'random',
  quoteLength: 'any',
  codeLength: 'medium',
}

export const modeLabels: Record<Mode, string> = {
  time: 'time',
  words: 'words',
  quote: 'quote',
  code: 'code',
  zen: 'zen',
  custom: 'custom',
}

export const contentTypeLabels: Record<ContentType, string> = {
  words: 'words',
  numbers: 'numbers',
  quotes: 'quote',
  code: 'code',
  zen: 'zen',
  custom: 'custom',
}

export const amountOptions: Record<Mode, number[]> = {
  time: [...timeOptions],
  words: [...wordAmounts],
  quote: [],
  code: [],
  zen: [],
  custom: [],
}

export const maxTime = 1800
export const maxWords = 500
