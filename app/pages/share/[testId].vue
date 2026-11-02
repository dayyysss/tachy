<script setup lang="ts">
import { Check } from 'lucide-vue-next'

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
  title: () => data.value ? `${Math.round(data.value.wpm)} WPM Typing Result — Tachy` : 'Shared Result',
  description: () => data.value ? `Verified typing score: ${Math.round(data.value.wpm)} WPM with ${Math.round(data.value.accuracy)}% accuracy on Tachy.` : 'Shared typing result.',
  robots: 'noindex,follow',
  twitterCard: 'summary_large_image',
})

const configLabel = computed(() => {
  if (!data.value) return ''
  const c = data.value.config
  if (c.mode === 'time') return `${c.amount}s`
  if (c.mode === 'words') return `${c.amount} words`
  return c.mode
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col items-center justify-center px-4 py-16 md:py-24">
    <!-- Verified Result Card -->
    <div v-if="data" class="w-full rounded-2xl border border-base-300 bg-base-200/50 p-6 sm:p-10 shadow-2xl backdrop-blur-xs text-center">
      <div class="flex items-center justify-between border-b border-base-300 pb-4">
        <BrandLogo />
        <div class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
          <Check class="size-3" />
          <span>Verified Score</span>
        </div>
      </div>

      <div class="my-8">
        <p class="font-mono text-xs uppercase tracking-widest text-base-content/40">Words Per Minute</p>
        <p class="mt-2 font-mono text-8xl font-bold tracking-tight text-primary">{{ Math.round(data.wpm) }}</p>
        <div class="mt-3 inline-flex items-center gap-2 rounded-full bg-base-300/60 px-4 py-1 font-mono text-xs">
          <span>{{ Math.round(data.accuracy) }}% Accuracy</span>
          <span class="opacity-30">·</span>
          <span>{{ data.config.language.toUpperCase() }}</span>
          <span class="opacity-30">·</span>
          <span>{{ data.config.contentType }}</span>
          <span class="opacity-30">·</span>
          <span>{{ configLabel }}</span>
        </div>
      </div>

      <div class="border-t border-base-300 pt-5 text-xs text-base-content/60 flex items-center justify-between font-mono">
        <div>
          <span>Typist: </span>
          <NuxtLink v-if="data.username" :to="`/u/${data.username}`" class="font-semibold text-primary hover:underline">
            @{{ data.username }}
          </NuxtLink>
          <span v-else class="italic opacity-60">Anonymous Guest</span>
        </div>
        <span class="opacity-40">{{ new Date(data.createdAt).toLocaleDateString() }}</span>
      </div>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <NuxtLink to="/" class="btn btn-primary btn-sm px-6 font-semibold shadow-xs">
          Beat this score →
        </NuxtLink>
        <NuxtLink :to="`/replay/${testId}`" class="btn btn-ghost btn-sm border border-base-300 text-base-content/70">
          Watch replay
        </NuxtLink>
      </div>
    </div>

    <!-- Error state -->
    <div v-else class="rounded-box border border-base-300 bg-base-200/40 p-8 text-center text-sm opacity-60">
      This result is private or does not exist.
    </div>
  </div>
</template>
