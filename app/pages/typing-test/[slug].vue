<script setup lang="ts">
import { landingPageMap, landingPages } from '#shared/config/seo'
import type { TestConfig } from '#shared/config/modes'

const route = useRoute()
const slug = String(route.params.slug)
const page = landingPageMap.get(slug)

if (!page) {
  throw createError({ statusCode: 404, statusMessage: 'Landing page not found' })
}

const store = useTestStore()

useSeoMeta({
  title: `${page.title}`,
  description: page.description,
  ogTitle: `${page.title}`,
  ogDescription: page.description,
  robots: 'index,follow',
  twitterCard: 'summary_large_image',
})

const related = computed(() =>
  landingPages.filter(item => item.kind === page.kind && item.slug !== page.slug).slice(0, 6),
)

function start() {
  const patch: Partial<TestConfig> = { order: 'random', punctuation: false, numbers: false }
  if (page.kind === 'language' && page.language) {
    Object.assign(patch, { language: page.language, contentType: 'words', mode: 'time', amount: 60 })
  } else if (page.kind === 'duration' && page.amount) {
    Object.assign(patch, { contentType: 'words', mode: 'time', amount: page.amount })
  } else if (page.kind === 'words' && page.amount) {
    Object.assign(patch, { contentType: 'words', mode: 'words', amount: page.amount })
  } else {
    Object.assign(patch, { contentType: 'words', mode: 'time', amount: 60 })
  }
  store.setConfig(patch)
  navigateTo('/')
}
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-12 space-y-10">
    <nav class="text-xs font-mono opacity-50 flex items-center gap-1.5">
      <NuxtLink to="/typing-test" class="hover:text-primary">Typing test</NuxtLink>
      <span>/</span>
      <span class="text-base-content">{{ page.title }}</span>
    </nav>

    <!-- Preset Hero -->
    <div class="rounded-2xl border border-base-300 bg-base-200/50 p-6 sm:p-10 shadow-xs">
      <span class="rounded-full bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
        Preset Mode: {{ page.kind }}
      </span>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">{{ page.title }}</h1>
      <p class="mt-2 text-sm text-base-content/60 sm:text-base leading-relaxed">{{ page.description }}</p>

      <div class="mt-6 flex flex-wrap items-center gap-4 border-t border-base-300 pt-6">
        <button type="button" class="btn btn-primary btn-sm px-6 font-semibold shadow-xs" @click="start">
          Launch Test Now →
        </button>
        <span class="text-xs text-base-content/50 font-mono">No registration required.</span>
      </div>
    </div>

    <!-- Highlights -->
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-box border border-base-300 bg-base-200/30 p-5 space-y-2">
        <h3 class="text-sm font-semibold">Live Real-time Telemetry</h3>
        <p class="text-xs leading-relaxed text-base-content/70">
          Track raw WPM, net speed, accuracy percentage, and per-second speed consistency curves during your session.
        </p>
      </div>

      <div class="rounded-box border border-base-300 bg-base-200/30 p-5 space-y-2">
        <h3 class="text-sm font-semibold">Competitive Leaderboard Eligibility</h3>
        <p class="text-xs leading-relaxed text-base-content/70">
          Valid completed tests with at least 90% accuracy automatically qualify for daily, weekly, and all-time boards.
        </p>
      </div>
    </div>

    <!-- Related Presets -->
    <section v-if="related.length" class="space-y-3">
      <h2 class="text-xs font-mono font-semibold uppercase tracking-widest text-base-content/40">Related Presets</h2>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="item in related"
          :key="item.slug"
          :to="`/typing-test/${item.slug}`"
          class="rounded-lg border border-base-300 bg-base-200/40 px-3 py-1.5 text-xs font-medium text-base-content/70 hover:border-primary hover:text-primary transition-all"
        >
          {{ item.title }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
