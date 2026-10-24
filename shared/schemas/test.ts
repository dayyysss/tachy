import { z } from 'zod'
import { contentTypes, modes, orders, quoteLengths, codeLengths } from '#shared/config/modes'

export const testConfigSchema = z.object({
  contentType: z.enum(contentTypes),
  mode: z.enum(modes),
  amount: z.number().int().min(0).max(1800),
  language: z.string().min(1).max(16),
  codeLanguage: z.string().min(1).max(16).default('js'),
  punctuation: z.boolean().default(false),
  numbers: z.boolean().default(false),
  order: z.enum(orders).default('random'),
  quoteLength: z.enum(quoteLengths).default('any'),
  codeLength: z.enum(codeLengths).default('medium'),
  customText: z.string().max(10000).optional(),
})

export const keystrokeSchema = z.object({
  t: z.number().min(0),
  key: z.string().min(0).max(4),
  correct: z.boolean(),
})

export const startTestSchema = z.object({
  config: testConfigSchema,
  seed: z.string().min(1).max(256).optional(),
})

export const submitTestSchema = z.object({
  testId: z.string().min(8).max(128),
  token: z.string().min(16),
  seed: z.string().min(1).max(256),
  config: testConfigSchema,
  keystrokes: z.array(keystrokeSchema).max(200000),
  claimed: z.object({
    wpm: z.number(),
    rawWpm: z.number(),
    accuracy: z.number(),
    consistency: z.number(),
    durationMs: z.number(),
  }),
  isDailyChallenge: z.boolean().default(false),
})

export type TestConfigInput = z.infer<typeof testConfigSchema>
export type SubmitTestInput = z.infer<typeof submitTestSchema>
