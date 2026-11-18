import { getSessionUser } from '../utils/session'

export default defineEventHandler(async event => {
  const path = event.path
  const config = useRuntimeConfig(event)
  const loginSegment = (config.adminLoginPath || process.env.ADMIN_LOGIN_PATH || process.env.ADMIN_PATH || 'tachyPanel').replace(/^\/+|\/+$/g, '')
  const panelSegment = (config.adminPanelBase || process.env.ADMIN_PANEL_PREFIX || 'tachos').replace(/^\/+|\/+$/g, '')
  const loginPath = `/${loginSegment}`
  const panelBase = `/${panelSegment}`

  // Static assets & internal Nuxt builds are always accessible
  if (path.startsWith('/_nuxt') || path.startsWith('/__sitemap__') || path.startsWith('/icons') || path.startsWith('/brand') || path.startsWith('/api/files') || path.startsWith('/favicon')) return
  if (/\.(?:png|jpg|jpeg|webp|avif|svg|ico|css|js|woff2?|map)$/i.test(path)) return

  // Health check endpoint
  if (path === '/api/health') return

  // Site config endpoint
  if (path === '/api/site-config') return

  // Admin routes and administrative API endpoints
  if (path === loginPath || path.startsWith(`${loginPath}/`) || path === panelBase || path.startsWith(`${panelBase}/`) || path.startsWith('/api/admin')) return

  // Auth routes must remain accessible so administrators can authenticate
  if (path.startsWith('/api/auth')) {
    const flags = await getSiteFlags()
    if ((flags.maintenance || !flags.signups) && path.startsWith('/api/auth/sign-up')) {
      throw createError({ statusCode: 403, statusMessage: 'Registrations are currently closed' })
    }
    return
  }

  const flags = await getSiteFlags()

  if (flags.maintenance) {
    const query = getQuery(event)
    if (query.bypass === '1') {
      const user = await getSessionUser(event)
      if (user?.role === 'admin') return
    }

    throw createError({ statusCode: 503, statusMessage: 'Tachy is under maintenance' })
  }

  if (!flags.signups && path.startsWith('/api/auth/sign-up')) {
    throw createError({ statusCode: 403, statusMessage: 'Signups are closed' })
  }
  if (!flags.leaderboards && path.startsWith('/api/leaderboard')) {
    throw createError({ statusCode: 503, statusMessage: 'Leaderboards are disabled' })
  }
})
