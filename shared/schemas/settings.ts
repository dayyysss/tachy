import { z } from 'zod'

export const settingsSchema = z.object({
  theme: z.string().min(1).max(40).default('tachy'),
  themeAuto: z.boolean().default(false),
  themeLight: z.string().default('light'),
  themeDark: z.string().default('tachy'),
  themeFavorites: z.array(z.string()).default([]),
  appearance: z.object({
    fontFamily: z.enum(['mono', 'sans']).default('mono'),
    fontSize: z.number().min(1).max(3).default(1.5),
    textWidth: z.enum(['narrow', 'medium', 'wide']).default('medium'),
    caretStyle: z.enum(['line', 'block', 'underline', 'outline']).default('line'),
    smoothCaret: z.boolean().default(true),
    showLiveWpm: z.boolean().default(false),
    showLiveAccuracy: z.boolean().default(false),
    showTimer: z.boolean().default(true),
    focusMode: z.boolean().default(true),
    reduceMotion: z.boolean().default(false),
    showKeyboard: z.boolean().default(false),
  }).prefault({}),
  behavior: z.object({
    quickRestart: z.enum(['tab', 'esc', 'both']).default('both'),
    stopOnError: z.enum(['off', 'letter', 'word']).default('off'),
    backspaceRule: z.enum(['normal', 'stop_at_word_start']).default('normal'),
    blindMode: z.boolean().default(false),
    defaultLanguage: z.string().default('en'),
    defaultMode: z.enum(['time', 'words', 'quote', 'code', 'zen', 'custom']).default('time'),
    defaultAmount: z.number().int().min(1).max(1800).default(30),
  }).prefault({}),
  sound: z.object({
    enabled: z.boolean().default(false),
    pack: z.enum(['mechanical', 'typewriter', 'soft']).default('soft'),
    volume: z.number().min(0).max(1).default(0.4),
    errorSound: z.boolean().default(true),
  }).prefault({}),
  goals: z.object({
    dailyTests: z.number().int().min(1).max(100).default(10),
    targetWpm: z.number().int().min(10).max(300).default(60),
  }).prefault({}),
  language: z.enum(['en', 'id']).default('en'),
  publicProfile: z.boolean().default(true),
})

export type Settings = z.infer<typeof settingsSchema>

export const defaultSettings: Settings = settingsSchema.parse({})

