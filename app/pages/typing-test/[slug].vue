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
  <div class="mx-auto w-full max-w-3xl px-4 py-12">
    <nav class="mb-4 text-xs opacity-50">
      <NuxtLink to="/typing-test" class="hover:text-primary">Typing test</NuxtLink>
      <span> / {{ page.title }}</span>
    </nav>

    <h1 class="text-3xl font-semibold">{{ page.title }}</h1>
    <p class="mt-2 text-base-content/60">{{ page.description }}</p>

    <div class="mt-6 rounded-box border border-base-300 bg-base-200/40 p-6">
      <p class="text-sm text-base-content/70">
        Start a {{ page.kind === 'duration' ? `${page.amount}-second` : 'free' }} test with the preset for this page.
        No signup needed. Progress is stored locally until you create an account.
      </p>
      <button type="button" class="btn btn-primary mt-4" @click="start">Start test</button>
    </div>

    <section class="mt-10">
      <h2 class="text-lg font-semibold">Why practice here</h2>
      <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-base-content/70">
        <li>Live WPM, raw speed, accuracy, and consistency.</li>
        <li>Daily streaks and a GitHub-style activity heatmap for members.</li>
        <li>Replay-verified leaderboards instead of unchecked screenshots.</li>
        <li>English, Indonesian, code, numbers, and quotes in one place.</li>
      </ul>
    </section>

    <section v-if="related.length" class="mt-10">
      <h2 class="text-lg font-semibold">Related tests</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink v-for="item in related" :key="item.slug" :to="`/typing-test/${item.slug}`" class="btn btn-ghost btn-sm">
          {{ item.title }}
        </NuxtLink>
      </div>
    </section>

    <section class="mt-10">
      <h2 class="text-lg font-semibold">Guides</h2>
      <div class="mt-3 flex flex-wrap gap-2 text-sm">
        <NuxtLink to="/learn/average-typing-speed" class="link link-hover">Average typing speed</NuxtLink>
        <NuxtLink to="/learn/touch-typing-10-fingers" class="link link-hover">Learn 10-finger typing</NuxtLink>
        <NuxtLink to="/learn/five-minute-daily-drill" class="link link-hover">5-minute daily drill</NuxtLink>
      </div>
    </section>
  </div>
</template>

