import { pgTable, text, integer, numeric, timestamp, jsonb, date, primaryKey, bigint, boolean, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const dailyStats = pgTable('daily_stats', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  localDate: date('local_date').notNull(),
  testsCount: integer('tests_count').notNull().default(0),
  wordsTyped: integer('words_typed').notNull().default(0),
  timeMs: bigint('time_ms', { mode: 'number' }).notNull().default(0),
  bestWpm: numeric('best_wpm', { precision: 6, scale: 2 }).notNull().default('0'),
  sumWpm: numeric('sum_wpm', { precision: 12, scale: 2 }).notNull().default('0'),
  sumAccuracy: numeric('sum_accuracy', { precision: 12, scale: 2 }).notNull().default('0'),
  xpEarned: integer('xp_earned').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.userId, table.localDate] })])

export const userStats = pgTable('user_stats', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  totalTests: integer('total_tests').notNull().default(0),
  totalWords: integer('total_words').notNull().default(0),
  totalChars: integer('total_chars').notNull().default(0),
  totalTimeMs: bigint('total_time_ms', { mode: 'number' }).notNull().default(0),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActiveDate: date('last_active_date'),
  keyErrors: jsonb('key_errors').$type<Record<string, number>>().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const personalBests = pgTable('personal_bests', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  configKey: text('config_key').notNull(),
  wpm: numeric('wpm', { precision: 6, scale: 2 }).notNull(),
  accuracy: numeric('accuracy', { precision: 6, scale: 2 }).notNull(),
  testId: text('test_id').notNull(),
  achievedAt: timestamp('achieved_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.userId, table.configKey] })])

export const userAchievements = pgTable('user_achievements', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  testId: text('test_id'),
}, table => [primaryKey({ columns: [table.userId, table.achievementId] })])

export const userSettings = pgTable('user_settings', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  settings: jsonb('settings').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sequentialProgress = pgTable('sequential_progress', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  language: text('language').notNull(),
  list: text('list').notNull(),
  position: integer('position').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.userId, table.language, table.list] })])

export const userLanguageStats = pgTable('user_language_stats', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  language: text('language').notNull(),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(0),
  totalTests: integer('total_tests').notNull().default(0),
  totalWords: integer('total_words').notNull().default(0),
  totalTimeMs: bigint('total_time_ms', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.userId, table.language] })])

export const shareVisibility = pgTable('share_visibility', {
  testId: uuid('test_id').primaryKey(),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

