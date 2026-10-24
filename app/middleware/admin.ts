export default defineNuxtRouteMiddleware(async to => {
  const config = useRuntimeConfig()
  const loginPath = config.public.adminLoginPath || '/tachyPanel'
  const panelBase = config.public.adminPanelBase || `/${to.path.split('/').filter(Boolean)[0] ?? 'tachos'}`
  let session: { user?: { role?: string; twoFactorEnabled?: boolean } } | null = null

  try {
    session = await $fetch<{ user?: { role?: string; twoFactorEnabled?: boolean } }>('/api/auth/get-session')
  } catch {
    return navigateTo(loginPath)
  }

  const user = session?.user
  if (!user || user.role !== 'admin') {
    return navigateTo(loginPath)
  }

  if (config.public.adminRequire2fa && !user.twoFactorEnabled && !to.path.endsWith('/setup')) {
    return navigateTo(`${panelBase}/setup`)
  }
})
