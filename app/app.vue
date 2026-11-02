<script setup lang="ts">
import type { SeoConfig } from '#shared/schemas/seo'

const { fetchSession } = useAuth()
await useAsyncData('auth_session', () => fetchSession())

const { data: siteConfig } = await useFetch<{ seo?: SeoConfig }>('/api/site-config')

useHead(() => {
  const seo = siteConfig.value?.seo
  const meta: { name: string; content: string }[] = []
  if (seo?.verification?.google) {
    meta.push({ name: 'google-site-verification', content: seo.verification.google })
  }
  if (seo?.verification?.bing) {
    meta.push({ name: 'msvalidate.01', content: seo.verification.bing })
  }
  if (seo?.twitterHandle) {
    meta.push({ name: 'twitter:site', content: seo.twitterHandle.startsWith('@') ? seo.twitterHandle : `@${seo.twitterHandle}` })
  }
  return {
    titleTemplate: (titleChunk?: string) => {
      const template = seo?.titleTemplate || '%s · Tachy'
      return titleChunk ? template.replace('%s', titleChunk) : (seo?.siteName || 'Tachy')
    },
    meta,
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
