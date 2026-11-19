import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const adminLoginSegment = (process.env.ADMIN_LOGIN_PATH || process.env.ADMIN_PATH || 'tachyPanel').replace(/^\/+|\/+$/g, '')
const adminPanelSegment = (process.env.ADMIN_PANEL_PREFIX || 'tachos').replace(/^\/+|\/+$/g, '')
const adminLoginPath = `/${adminLoginSegment}`
const adminPanelBase = `/${adminPanelSegment}`

export default defineNuxtConfig({
  compatibilityDate: '2026-10-23',
  devtools: { enabled: true },
  srcDir: 'app/',
  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
  ],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  components: [{ path: '~/components', pathPrefix: false }],
  pwa: {
    registerType: 'autoUpdate',
    devOptions: {
      enabled: true,
      type: 'module',
    },
    manifest: {
      name: 'Tachy — Typing Test',
      short_name: 'Tachy',
      description: 'Type. Measure. Improve.',
      theme_color: '#F4C95D',
      background_color: '#17191C',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: null,
      navigateFallbackDenylist: [/^\/api\//, /^\/sw\.js$/, /^\/workbox-.*\.js$/],
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      cleanupOutdatedCaches: true,
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  runtimeConfig: {
    adminLoginPath,
    adminPanelBase,
    testTokenSecret: process.env.TEST_TOKEN_SECRET || '',
    databaseUrl: process.env.DATABASE_URL || '',
    public: {
      siteUrl,
      adminLoginPath,
      adminPanelBase,
      adminRequire2fa: process.env.ADMIN_REQUIRE_2FA === 'true',
    },
  },
  site: {
    url: siteUrl,
    name: 'Tachy',
    description:
      'Free typing test in English, Indonesian, code, and quotes. Track WPM, accuracy, daily streaks, and climb fair leaderboards. No signup needed.',
    defaultLocale: 'en',
    googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION,
    bingSiteVerification: process.env.BING_SITE_VERIFICATION,
  },
  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'id', language: 'id-ID', name: 'Bahasa Indonesia', file: 'id.json' },
    ],
    detectBrowserLanguage: false,
  },
  ogImage: {
    enabled: false,
  },
  routeRules: {
    '/': { swr: false },
    '/leaderboard': { swr: 30, cache: { varies: ['accept'] } },
    '/about': { swr: 60, cache: { varies: ['accept'] } },
    '/daily': { swr: 60, cache: { varies: ['accept'] } },
    '/api/leaderboard/**': { swr: 30 },
    '/api/stats/**': { swr: 60 },
    '/api/sitemap': { swr: 3600 },
    '/dashboard/**': { ssr: false, robots: false },
    '/settings': { ssr: false, robots: false },
    [adminLoginPath]: { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    [`${adminPanelBase}/**`]: { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
  hooks: {
    'pages:extend'(pages) {
      const dir = fileURLToPath(new URL('./app/admin/pages', import.meta.url))
      const adminRoutes = [
        ['index', ''],
        ['index', '/dashboard'],
        ['users', '/users'],
        ['moderation', '/moderation'],
        ['files', '/files'],
        ['branding', '/branding'],
        ['settings', '/settings'],
        ['audit', '/audit'],
        ['monitoring', '/monitoring'],
        ['setup', '/setup'],
        ['profile', '/profile'],
      ] as const

      for (const [name, segment] of adminRoutes) {
        pages.push({
          name: `admin-${name}${segment === '/dashboard' ? '-dash' : ''}`,
          path: `${adminPanelBase}${segment}`,
          file: `${dir}/${name}.vue`,
          meta: { layout: 'admin' },
        })
      }

      pages.push({
        name: 'admin-login',
        path: adminLoginPath,
        file: `${dir}/login.vue`,
        meta: { layout: 'focus' },
      })
    },
  },
  robots: {
    disallow: ['/api/', '/dashboard', '/settings', '/login', '/register'],
  },
  sitemap: {
    sources: ['/api/sitemap'],
    exclude: ['/dashboard/**', '/settings', '/login', '/register', adminLoginPath, `${adminPanelBase}/**`],
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      titleTemplate: '%s · Tachy',
      link: [
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap' },
      ],
    },
  },
  nitro: {
    compressPublicAssets: true,
  },
})


