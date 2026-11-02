<script setup lang="ts">
import { landingPages } from '#shared/config/seo'

useSeoMeta({
  title: 'Free Typing Test Presets',
  description: 'Take a free typing test with live WPM, accuracy, and consistency. Practice English, Indonesian, code, quotes, and more.',
  ogTitle: 'Free Typing Test Presets',
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
  <div class="mx-auto w-full max-w-4xl px-4 py-12 space-y-10">
    <!-- Header -->
    <div class="rounded-2xl border border-base-300 bg-base-200/50 p-6 sm:p-10 shadow-xs">
      <span class="rounded-full bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
        Test Directory
      </span>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
        Typing Test Presets
      </h1>
      <p class="mt-2 text-sm text-base-content/60 sm:text-base">
        Select a preset below to practice with specific languages, test durations, word amounts, or keyboard layout mappings.
      </p>
      <div class="mt-6">
        <NuxtLink to="/" class="btn btn-primary btn-sm px-5 font-semibold shadow-xs">Start Default 30s Test →</NuxtLink>
      </div>
    </div>

    <!-- Presets Sections -->
    <div class="grid gap-6 sm:grid-cols-2">
      <!-- Languages -->
      <section class="rounded-box border border-base-300 bg-base-200/30 p-5 space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-base-content/60 font-mono">By Language</h2>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="page in groups.languages"
            :key="page.slug"
            :to="`/typing-test/${page.slug}`"
            class="rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-medium text-base-content/80 hover:border-primary hover:text-primary transition-all"
          >
            {{ page.title }}
          </NuxtLink>
        </div>
      </section>

      <!-- Durations -->
      <section class="rounded-box border border-base-300 bg-base-200/30 p-5 space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-base-content/60 font-mono">By Duration</h2>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="page in groups.durations"
            :key="page.slug"
            :to="`/typing-test/${page.slug}`"
            class="rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-mono font-medium text-base-content/80 hover:border-primary hover:text-primary transition-all"
          >
            {{ page.title }}
          </NuxtLink>
        </div>
      </section>

      <!-- Word Counts -->
      <section class="rounded-box border border-base-300 bg-base-200/30 p-5 space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-base-content/60 font-mono">By Word Count</h2>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="page in groups.words"
            :key="page.slug"
            :to="`/typing-test/${page.slug}`"
            class="rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-mono font-medium text-base-content/80 hover:border-primary hover:text-primary transition-all"
          >
            {{ page.title }}
          </NuxtLink>
        </div>
      </section>

      <!-- Keyboard Layouts -->
      <section class="rounded-box border border-base-300 bg-base-200/30 p-5 space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-base-content/60 font-mono">By Keyboard Layout</h2>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="page in groups.layouts"
            :key="page.slug"
            :to="`/typing-test/${page.slug}`"
            class="rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-medium text-base-content/80 hover:border-primary hover:text-primary transition-all"
          >
            {{ page.title }}
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>
