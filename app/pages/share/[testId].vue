<script setup lang="ts">
const route = useRoute()
const testId = String(route.params.testId)

const { data, error } = await useFetch<{
  wpm: number
  accuracy: number
  config: { language: string; contentType: string; mode: string; amount: number }
  username?: string
  createdAt: string
}>(`/api/share/${encodeURIComponent(testId)}`)

if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Result not found' })
}

useSeoMeta({
  title: () => data.value ? `${Math.round(data.value.wpm)} WPM Typing Result` : 'Shared result',
  description: () => data.value ? `${Math.round(data.value.wpm)} WPM with ${Math.round(data.value.accuracy)}% accuracy.` : 'Shared typing result.',
  robots: 'noindex,follow',
})
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-16 text-center">
    <template v-if="data">
      <p class="text-xs uppercase tracking-[0.3em] opacity-50">Tachy result</p>
      <p class="mt-3 text-7xl font-semibold text-primary">{{ Math.round(data.wpm) }}</p>
      <p class="text-sm uppercase tracking-wide opacity-60">wpm</p>
      <p class="mt-2 text-lg">{{ Math.round(data.accuracy) }}% accuracy</p>
      <p class="mt-1 text-sm opacity-50">
        {{ data.config.language.toUpperCase() }} · {{ data.config.contentType }} · {{ data.config.amount || data.config.mode }}
      </p>
      <p v-if="data.username" class="mt-4 text-sm">by @{{ data.username }}</p>
      <NuxtLink to="/" class="btn btn-primary mt-6">Beat this score</NuxtLink>
    </template>
    <div v-else class="rounded-box border border-base-300 p-8 text-sm opacity-60">
      This result is private or does not exist.
    </div>
  </div>
</template>

