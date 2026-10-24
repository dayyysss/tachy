import { landingPages } from '#shared/config/seo'
import { guides } from '#shared/data/guides'

export default defineEventHandler(() => {
  const today = new Date().toISOString().slice(0, 10)

  const entries = [
    { loc: '/', changefreq: 'daily' as const, priority: 1 },
    { loc: '/typing-test', changefreq: 'weekly' as const, priority: 0.9 },
    { loc: '/leaderboard', changefreq: 'daily' as const, priority: 0.8 },
    { loc: '/daily', changefreq: 'daily' as const, priority: 0.8 },
    { loc: '/about', changefreq: 'monthly' as const, priority: 0.6 },
    { loc: '/learn', changefreq: 'weekly' as const, priority: 0.7 },
    ...landingPages.map(page => ({
      loc: `/typing-test/${page.slug}`,
      changefreq: 'weekly' as const,
      priority: 0.7,
    })),
    ...guides.map(guide => ({
      loc: `/learn/${guide.slug}`,
      changefreq: 'monthly' as const,
      priority: 0.6,
    })),
  ]

  return entries.map(entry => ({ ...entry, lastmod: today }))
})
