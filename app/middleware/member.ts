export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchSession } = useAuth()
  if (!user.value) {
    await fetchSession()
  }

  if (!user.value) {
    return navigateTo('/login')
  }

  // Admin users are restricted to the admin panel and cannot access the member area
  if (user.value.role === 'admin') {
    const config = useRuntimeConfig()
    const panelBase = config.public.adminPanelBase || '/tachos'
    return navigateTo(`${panelBase}/dashboard`)
  }
})
