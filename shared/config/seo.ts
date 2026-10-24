import { languages } from './languages'

export interface SeoRoute {
  title: string
  description: string
  robots: string
  priority: number
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  og: 'home' | 'result' | 'profile' | 'leaderboard' | 'daily' | 'default'
}

export const defaultTitle = 'Free Typing Test with Progress Tracking'
export const defaultDescription =
  'Free typing test in English, Indonesian, code, and quotes. Track WPM, accuracy, daily streaks, and climb fair leaderboards. No signup needed.'

export const seoRoutes: Record<string, SeoRoute> = {
  home: { title: defaultTitle, description: defaultDescription, robots: 'index,follow', priority: 1, changefreq: 'daily', og: 'home' },
  leaderboard: { title: 'Typing Leaderboards — Daily, Weekly, All-Time', description: 'See the fastest typists by language, mode, and period. Fair, replay-verified typing leaderboards.', robots: 'index,follow', priority: 0.8, changefreq: 'daily', og: 'leaderboard' },
  daily: { title: 'Daily Typing Challenge', description: 'The same typing text for everyone, every day. Compare your WPM and accuracy on today’s challenge.', robots: 'index,follow', priority: 0.8, changefreq: 'daily', og: 'daily' },
  about: { title: 'About', description: 'How Tachy measures WPM, accuracy, and progress, plus live community statistics.', robots: 'index,follow', priority: 0.6, changefreq: 'monthly', og: 'default' },
  settings: { title: 'Settings', description: 'Customize themes, typing behavior, sounds, and account preferences.', robots: 'noindex,nofollow', priority: 0, changefreq: 'yearly', og: 'default' },
  login: { title: 'Sign In', description: 'Sign in to save your typing progress.', robots: 'noindex,follow', priority: 0, changefreq: 'yearly', og: 'default' },
  register: { title: 'Sign Up', description: 'Create a free Tachy account.', robots: 'noindex,follow', priority: 0, changefreq: 'yearly', og: 'default' },
  dashboard: { title: 'Dashboard', description: 'Your typing progress.', robots: 'noindex,nofollow', priority: 0, changefreq: 'yearly', og: 'default' },
}

export const timeLandingAmounts = [15, 30, 60, 120]
export const wordLandingAmounts = [10, 25, 50, 100]

export interface LandingPage {
  slug: string
  kind: 'language' | 'duration' | 'words' | 'layout' | 'pillar'
  title: string
  description: string
  language?: string
  amount?: number
  layout?: 'qwerty' | 'dvorak' | 'colemak'
}

export const landingPages: LandingPage[] = [
  ...languages.filter(language => language.available).map(language => ({
    slug: language.landingSlug,
    kind: 'language' as const,
    title: `${language.englishName} Typing Test`,
    description: `Practice typing in ${language.englishName} and track your WPM, accuracy, and progress.`,
    language: language.code,
  })),
  ...timeLandingAmounts.map(amount => ({
    slug: `${amount}-seconds`,
    kind: 'duration' as const,
    title: `${amount}-Second Typing Test`,
    description: `Take a ${amount}-second typing test and see your WPM, raw speed, and accuracy.`,
    amount,
  })),
  ...wordLandingAmounts.map(amount => ({
    slug: `${amount}-words`,
    kind: 'words' as const,
    title: `${amount}-Word Typing Test`,
    description: `Test your typing speed with ${amount} words and get instant WPM and accuracy results.`,
    amount,
  })),
  ...(['qwerty', 'dvorak', 'colemak'] as const).map(layout => ({
    slug: `layout/${layout}`,
    kind: 'layout' as const,
    title: `${layout[0]!.toUpperCase()}${layout.slice(1)} Typing Test`,
    description: `Practice typing with the ${layout} keyboard layout and compare your speed.`,
    layout,
  })),
]

export const landingPageMap = new Map(landingPages.map(page => [page.slug, page]))




