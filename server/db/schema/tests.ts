import { pgTable, uuid, text, integer, boolean, numeric, timestamp, jsonb, date , pgEnum, index } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const contentTypeEnum = pgEnum('content_type', ['words', 'numbers', 'quotes', 'code'])
export const modeEnum = pgEnum('test_mode', ['time', 'words', 'quote', 'code', 'zen', 'custom'])
export const orderEnum = pgEnum('word_order', ['random', 'sequential'])
export const testStatusEnum = pgEnum('test_status', ['valid', 'flagged', 'unranked'])

export const tests = pgTable('tests', {
  id: uuid('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  language: text('language').notNull(),
  contentType: contentTypeEnum('content_type').notNull(),
  mode: modeEnum('mode').notNull(),
  amount: integer('amount'),
  punctuation: boolean('punctuation').notNull().default(false),
  numbers: boolean('numbers').notNull().default(false),
  order: orderEnum('order').notNull().default('random'),
  seed: text('seed').notNull(),
  wpm: numeric('wpm', { precision: 6, scale: 2 }).notNull(),
  rawWpm: numeric('raw_wpm', { precision: 6, scale: 2 }).notNull(),
  accuracy: numeric('accuracy', { precision: 6, scale: 2 }).notNull(),
  consistency: numeric('consistency', { precision: 6, scale: 2 }).notNull(),
  charsCorrect: integer('chars_correct').notNull(),
  charsIncorrect: integer('chars_incorrect').notNull(),
  charsExtra: integer('chars_extra').notNull(),
  charsMissed: integer('chars_missed').notNull(),
  wordsTyped: integer('words_typed').notNull(),
  durationMs: integer('duration_ms').notNull(),
  wpmSeries: jsonb('wpm_series').notNull(),
  keystrokes: jsonb('keystrokes').notNull(),
  status: testStatusEnum('status').notNull().default('valid'),
  flagReasons: jsonb('flag_reasons'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNote: text('review_note'),
  isDailyChallenge: boolean('is_daily_challenge').notNull().default(false),
  localDate: date('local_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('tests_user_created_idx').on(table.userId, table.createdAt),
  index('tests_user_local_date_idx').on(table.userId, table.localDate),
  index('tests_rank_idx').on(table.language, table.contentType, table.mode, table.amount, table.wpm),
  index('tests_status_idx').on(table.status),
])

export const testTokens = pgTable('test_tokens', {
  id: uuid('id').primaryKey(),
  userId: text('user_id'),
  configKey: text('config_key').notNull(),
  seed: text('seed').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
})


