export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event)
  const loginSegment = (config.adminLoginPath || process.env.ADMIN_LOGIN_PATH || process.env.ADMIN_PATH || 'tachyPanel').replace(/^\/+|\/+$/g, '')
  const panelSegment = (config.adminPanelBase || process.env.ADMIN_PANEL_PREFIX || 'tachos').replace(/^\/+|\/+$/g, '')
  const loginPath = `/${loginSegment}`
  const panelBase = `/${panelSegment}`

  if (event.path === loginPath || event.path === `${loginPath}/`) {
    const user = await getSessionUser(event)
    if (user && user.role === 'admin') {
      return sendRedirect(event, `${panelBase}/dashboard`, 302)
    }
    return
  }

  if (event.path === panelBase || event.path.startsWith(`${panelBase}/`)) {
    const user = await getSessionUser(event)
    if (!user || user.role !== 'admin') {
      return sendRedirect(event, loginPath, 302)
    }

    if (process.env.ADMIN_REQUIRE_2FA !== 'false' && !user.twoFactorEnabled && !event.path.endsWith('/setup')) {
      return sendRedirect(event, `${panelBase}/setup`, 302)
    }
  }
})
