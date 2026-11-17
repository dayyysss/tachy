<script setup lang="ts">
import type { SeoConfig } from '#shared/schemas/seo'

const { fetchSession, user } = useAuth()
await useAsyncData('auth_session', () => fetchSession())

const { data: siteConfig } = await useFetch<{ seo?: SeoConfig }>('/api/site-config')
const { brand } = useBrand()
const config = useRuntimeConfig()
const siteUrl = computed(() => (siteConfig.value?.seo?.siteUrl?.trim() || (config.public.siteUrl as string) || '').replace(/\/$/, ''))

useHead(() => {
  const seo = siteConfig.value?.seo
  const meta: { name?: string; property?: string; content: string }[] = []
  if (seo?.verification?.google) {
    meta.push({ name: 'google-site-verification', content: seo.verification.google })
  }
  if (seo?.verification?.bing) {
    meta.push({ name: 'msvalidate.01', content: seo.verification.bing })
  }
  if (seo?.twitterHandle) {
    meta.push({ name: 'twitter:site', content: seo.twitterHandle.startsWith('@') ? seo.twitterHandle : `@${seo.twitterHandle}` })
  }

  // Dynamic favicon & icons from active brand assets
  const faviconUrl = brand.value?.['favicon']?.url || '/favicon.ico'
  const logoMarkUrl = brand.value?.['logo-mark']?.url || brand.value?.['favicon']?.url || '/icons/180.png'

  // Dynamic Open Graph image from active brand assets
  const ogUrl = brand.value?.['og-default']?.url || brand.value?.['logo-on-dark']?.url || brand.value?.['logo-on-light']?.url || ''
  if (ogUrl) {
    const fullOg = ogUrl.startsWith('http') ? ogUrl : `${siteUrl.value}${ogUrl}`
    meta.push(
      { property: 'og:image', content: fullOg },
      { name: 'twitter:image', content: fullOg },
    )
  }

  return {
    titleTemplate: (titleChunk?: string) => {
      const template = seo?.titleTemplate || '%s · Tachy'
      return titleChunk ? template.replace('%s', titleChunk) : (seo?.siteName || 'Tachy')
    },
    meta,
    link: [
      { rel: 'icon', type: 'image/png', href: faviconUrl },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: logoMarkUrl },
      { rel: 'shortcut icon', href: faviconUrl },
    ],
  }
})

onMounted(async () => {
  if (user.value) {
    await syncPendingTestResult()
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ToastContainer />
  <DialogContainer />
</template>
