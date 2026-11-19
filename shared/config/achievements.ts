export type AchievementKind = 'tests' | 'streak' | 'wpm' | 'words' | 'languages' | 'accuracy' | 'code' | 'duration' | 'comeback' | 'time'

export interface AchievementReward {
  xp: number
  title: string
  perk: string
}

export interface AchievementDef {
  id: string
  label: string
  description: string
  kind: AchievementKind
  threshold: number
  reward: AchievementReward
}

export const achievements: AchievementDef[] = [
  {
    id: 'first-test',
    label: 'First Test',
    description: 'Selesaikan tes mengetik perdana Anda.',
    kind: 'tests',
    threshold: 1,
    reward: { xp: 100, title: 'Novice Typist', perk: 'Badge Profil Perdana & Status Verifikasi' },
  },
  {
    id: 'streak-7',
    label: 'Week Streak',
    description: 'Latihan mengetik 7 hari berturut-turut.',
    kind: 'streak',
    threshold: 7,
    reward: { xp: 350, title: 'Dedicated Scribe', perk: 'Aura Streak Bronze & Profil Highlight' },
  },
  {
    id: 'streak-30',
    label: 'Month Streak',
    description: 'Latihan konsisten 30 hari berturut-turut.',
    kind: 'streak',
    threshold: 30,
    reward: { xp: 1200, title: 'Habit Master', perk: 'Aura Streak Silver & Caret Pulse FX' },
  },
  {
    id: 'streak-100',
    label: 'Century Streak',
    description: 'Latihan tanpa putus 100 hari berturut-turut.',
    kind: 'streak',
    threshold: 100,
    reward: { xp: 5000, title: 'Centurion Legend', perk: 'Golden Avatar Frame Eksklusif' },
  },
  {
    id: 'wpm-40',
    label: 'Warming Up',
    description: 'Capai kecepatan mengetik 40 WPM.',
    kind: 'wpm',
    threshold: 40,
    reward: { xp: 150, title: 'Steady Operator', perk: 'Rank Speed Bronze Badge' },
  },
  {
    id: 'wpm-60',
    label: 'Cruising',
    description: 'Capai kecepatan mengetik 60 WPM.',
    kind: 'wpm',
    threshold: 60,
    reward: { xp: 300, title: 'Velocity Cadet', perk: 'Rank Speed Silver Badge' },
  },
  {
    id: 'wpm-80',
    label: 'Fast Fingers',
    description: 'Capai kecepatan mengetik 80 WPM.',
    kind: 'wpm',
    threshold: 80,
    reward: { xp: 600, title: 'Swift Typist', perk: 'Rank Speed Gold Badge' },
  },
  {
    id: 'wpm-100',
    label: 'Century',
    description: 'Capai kecepatan mengetik 100 WPM.',
    kind: 'wpm',
    threshold: 100,
    reward: { xp: 1500, title: 'Centurion Typist', perk: 'Triple Digit Leaderboard Flair' },
  },
  {
    id: 'wpm-120',
    label: 'Ludicrous Speed',
    description: 'Capai kecepatan mengetik 120 WPM.',
    kind: 'wpm',
    threshold: 120,
    reward: { xp: 3000, title: 'Hypersonic Typist', perk: 'Transcendent Neon Caret Glow' },
  },
  {
    id: 'words-1k',
    label: 'One Thousand',
    description: 'Ketik akumulasi total 1.000 kata.',
    kind: 'words',
    threshold: 1000,
    reward: { xp: 200, title: 'Word Crafter', perk: 'Akses Analisis Kata Terperinci' },
  },
  {
    id: 'words-10k',
    label: 'Ten Thousand',
    description: 'Ketik akumulasi total 10.000 kata.',
    kind: 'words',
    threshold: 10000,
    reward: { xp: 800, title: 'Prose Architect', perk: 'Export Telemetri & Replay Arsip' },
  },
  {
    id: 'words-100k',
    label: 'Hundred Thousand',
    description: 'Ketik akumulasi total 100.000 kata.',
    kind: 'words',
    threshold: 100000,
    reward: { xp: 4000, title: 'Wordsmith Grandmaster', perk: 'Hall of Fame Profile Crest' },
  },
  {
    id: 'perfectionist',
    label: 'Perfectionist',
    description: 'Akurasi 100% pada tes minimal durasi 60 detik.',
    kind: 'accuracy',
    threshold: 100,
    reward: { xp: 1000, title: 'Laser Precision', perk: 'Pure Diamond Accuracy Aura' },
  },
  {
    id: 'night-owl',
    label: 'Night Owl',
    description: 'Selesaikan tes di waktu larut malam (00:00 - 04:00).',
    kind: 'time',
    threshold: 0,
    reward: { xp: 250, title: 'Midnight Stalker', perk: 'Midnight Theme Accent Glow' },
  },
  {
    id: 'polyglot',
    label: 'Polyglot',
    description: 'Selesaikan tes di 3 bahasa berbeda atau lebih.',
    kind: 'languages',
    threshold: 3,
    reward: { xp: 500, title: 'Linguistic Maestro', perk: 'Multi-Language Leaderboard Badge' },
  },
  {
    id: 'coder',
    label: 'Coder',
    description: 'Selesaikan 10 sesi tes bahasa pemrograman (Code).',
    kind: 'code',
    threshold: 10,
    reward: { xp: 500, title: 'Syntax Hacker', perk: 'Terminal Caret Matrix Style' },
  },
  {
    id: 'marathoner',
    label: 'Marathoner',
    description: 'Selesaikan tes maraton berdurasi minimal 5 menit.',
    kind: 'duration',
    threshold: 300,
    reward: { xp: 600, title: 'Iron Endurance', perk: 'Marathon Resilience Crest' },
  },
  {
    id: 'comeback',
    label: 'Comeback',
    description: 'Kembali berlatih setelah jeda 7 hari atau lebih.',
    kind: 'comeback',
    threshold: 7,
    reward: { xp: 300, title: 'Phoenix Typist', perk: 'Streak Recovery Shield Token' },
  },
]

export const achievementMap = new Map(achievements.map(achievement => [achievement.id, achievement]))
