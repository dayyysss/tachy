export default defineEventHandler(async event => {
  const path = event.path
  const config = useRuntimeConfig(event)
  const loginSegment = (config.adminLoginPath || process.env.ADMIN_LOGIN_PATH || process.env.ADMIN_PATH || 'tachyPanel').replace(/^\/+|\/+$/g, '')
  const panelSegment = (config.adminPanelBase || process.env.ADMIN_PANEL_PREFIX || 'tachos').replace(/^\/+|\/+$/g, '')
  const loginPath = `/${loginSegment}`
  const panelBase = `/${panelSegment}`

  if (path === loginPath || path.startsWith(`${loginPath}/`) || path === panelBase || path.startsWith(`${panelBase}/`) || path.startsWith('/api/admin') || path === '/api/health') return
  if (path.startsWith('/_nuxt') || path.startsWith('/__sitemap__') || path.startsWith('/icons') || path === '/favicon.ico') return
  if (/\.(?:png|jpg|jpeg|webp|avif|svg|ico|css|js|woff2?|map)$/i.test(path)) return

  const flags = await getSiteFlags()

  if (flags.maintenance) {
    throw createError({ statusCode: 503, statusMessage: 'Tachy is under maintenance' })
  }
  if (!flags.signups && path.startsWith('/api/auth/sign-up')) {
    throw createError({ statusCode: 403, statusMessage: 'Signups are closed' })
  }
  if (!flags.leaderboards && path.startsWith('/api/leaderboard')) {
    throw createError({ statusCode: 503, statusMessage: 'Leaderboards are disabled' })
  }
})
