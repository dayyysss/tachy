<script setup lang="ts">
import { landingPages } from '#shared/config/seo'

useSeoMeta({
  title: 'Free Typing Test',
  description: 'Take a free typing test with live WPM, accuracy, and consistency. Practice English, Indonesian, code, quotes, and more.',
  ogTitle: 'Free Typing Test',
  ogDescription: 'Measure your WPM and accuracy in seconds. No signup needed.',
  robots: 'index,follow',
  twitterCard: 'summary_large_image',
})

const groups = computed(() => ({
  languages: landingPages.filter(page => page.kind === 'language'),
  durations: landingPages.filter(page => page.kind === 'duration'),
  words: landingPages.filter(page => page.kind === 'words'),
  layouts: landingPages.filter(page => page.kind === 'layout'),
}))
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-12">
    <h1 class="text-3xl font-semibold">Free typing test</h1>
    <p class="mt-2 text-base-content/60">
      Measure your words per minute, raw speed, accuracy, and consistency. Play instantly as a guest,
      then sign in to keep daily progress, streaks, and personal bests.
    </p>
    <NuxtLink to="/" class="btn btn-primary mt-5">Start a test</NuxtLink>

    <section class="mt-10">
      <h2 class="text-lg font-semibold">By language</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink v-for="page in groups.languages" :key="page.slug" :to="`/typing-test/${page.slug}`" class="btn btn-ghost btn-sm">{{ page.title }}</NuxtLink>
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-lg font-semibold">By duration</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink v-for="page in groups.durations" :key="page.slug" :to="`/typing-test/${page.slug}`" class="btn btn-ghost btn-sm">{{ page.title }}</NuxtLink>
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-lg font-semibold">By word count</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink v-for="page in groups.words" :key="page.slug" :to="`/typing-test/${page.slug}`" class="btn btn-ghost btn-sm">{{ page.title }}</NuxtLink>
      </div>
    </section>

    <section class="mt-8">
      <h2 class="text-lg font-semibold">By keyboard layout</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink v-for="page in groups.layouts" :key="page.slug" :to="`/typing-test/${page.slug}`" class="btn btn-ghost btn-sm">{{ page.title }}</NuxtLink>
      </div>
    </section>
  </div>
</template>

