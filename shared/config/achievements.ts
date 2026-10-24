export type AchievementKind = 'tests' | 'streak' | 'wpm' | 'words' | 'languages' | 'accuracy' | 'code' | 'duration' | 'comeback' | 'time'

export interface AchievementDef {
  id: string
  label: string
  description: string
  kind: AchievementKind
  threshold: number
}

export const achievements: AchievementDef[] = [
  { id: 'first-test', label: 'First Test', description: 'Complete your first test.', kind: 'tests', threshold: 1 },
  { id: 'streak-7', label: 'Week Streak', description: 'Practice 7 days in a row.', kind: 'streak', threshold: 7 },
  { id: 'streak-30', label: 'Month Streak', description: 'Practice 30 days in a row.', kind: 'streak', threshold: 30 },
  { id: 'streak-100', label: 'Century Streak', description: 'Practice 100 days in a row.', kind: 'streak', threshold: 100 },
  { id: 'wpm-40', label: 'Warming Up', description: 'Reach 40 WPM.', kind: 'wpm', threshold: 40 },
  { id: 'wpm-60', label: 'Cruising', description: 'Reach 60 WPM.', kind: 'wpm', threshold: 60 },
  { id: 'wpm-80', label: 'Fast Fingers', description: 'Reach 80 WPM.', kind: 'wpm', threshold: 80 },
  { id: 'wpm-100', label: 'Century', description: 'Reach 100 WPM.', kind: 'wpm', threshold: 100 },
  { id: 'wpm-120', label: 'Ludicrous Speed', description: 'Reach 120 WPM.', kind: 'wpm', threshold: 120 },
  { id: 'words-1k', label: 'One Thousand', description: 'Type 1,000 words total.', kind: 'words', threshold: 1000 },
  { id: 'words-10k', label: 'Ten Thousand', description: 'Type 10,000 words total.', kind: 'words', threshold: 10000 },
  { id: 'words-100k', label: 'Hundred Thousand', description: 'Type 100,000 words total.', kind: 'words', threshold: 100000 },
  { id: 'perfectionist', label: 'Perfectionist', description: '100% accuracy on a test of 60 seconds or more.', kind: 'accuracy', threshold: 100 },
  { id: 'night-owl', label: 'Night Owl', description: 'Complete a test between 00:00 and 04:00.', kind: 'time', threshold: 0 },
  { id: 'polyglot', label: 'Polyglot', description: 'Complete tests in 3 or more languages.', kind: 'languages', threshold: 3 },
  { id: 'coder', label: 'Coder', description: 'Complete 10 code tests.', kind: 'code', threshold: 10 },
  { id: 'marathoner', label: 'Marathoner', description: 'Complete a 5-minute test.', kind: 'duration', threshold: 300 },
  { id: 'comeback', label: 'Comeback', description: 'Return after 7 or more days away.', kind: 'comeback', threshold: 7 },
]

export const achievementMap = new Map(achievements.map(achievement => [achievement.id, achievement]))
