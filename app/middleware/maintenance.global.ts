export default defineNuxtRouteMiddleware(async to => {
  const config = useRuntimeConfig()
  const loginSegment = ((config.public.adminLoginPath as string) || 'tachyPanel').replace(/^\/+|\/+$/g, '')
  const panelSegment = ((config.public.adminPanelBase as string) || 'tachos').replace(/^\/+|\/+$/g, '')
  const loginPath = `/${loginSegment}`
  const panelBase = `/${panelSegment}`

  // Never block admin panel or admin login
  if (to.path === loginPath || to.path.startsWith(`${loginPath}/`) || to.path === panelBase || to.path.startsWith(`${panelBase}/`)) {
    return
  }

  const { data: siteConfig } = await useFetch<{ flags?: { maintenance?: boolean } }>('/api/site-config', {
    key: 'site-config',
  })

  if (siteConfig.value?.flags?.maintenance) {
    if (to.query.bypass === '1') {
      const { user } = useAuth()
      if (user.value?.role === 'admin') return
    }

    throw createError({
      statusCode: 503,
      statusMessage: 'Tachy is under maintenance',
      fatal: true,
    })
  }
})
