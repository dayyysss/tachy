<script setup lang="ts">
import { guides } from '#shared/data/guides'

useSeoMeta({
  title: 'Typing Guides & Tutorials — Tachy',
  description: 'Practical guides on typing speed, accuracy, touch typing, keyboard layouts, and daily practice.',
  robots: 'index,follow',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-12 space-y-10">
    <!-- Header -->
    <div class="rounded-2xl border border-base-300 bg-base-200/50 p-6 sm:p-10 shadow-xs">
      <span class="rounded-full bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
        Learning Center
      </span>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
        Typing Guides & Techniques
      </h1>
      <p class="mt-2 text-sm text-base-content/60 sm:text-base leading-relaxed">
        Curated, concise articles on ergonomics, finger placement, WPM mechanics, and speed training drills.
      </p>
    </div>

    <!-- Articles Grid -->
    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="guide in guides"
        :key="guide.slug"
        :to="`/learn/${guide.slug}`"
        class="group flex flex-col justify-between rounded-box border border-base-300 bg-base-200/30 p-5 transition-all hover:border-primary hover:bg-base-200/60"
      >
        <div>
          <div class="flex items-center justify-between text-xs font-mono text-base-content/40">
            <span>{{ guide.minutes }} min read</span>
            <span class="text-primary opacity-0 group-hover:opacity-100 transition-opacity">Read →</span>
          </div>
          <h2 class="mt-2 font-semibold text-base text-base-content group-hover:text-primary transition-colors">
            {{ guide.title }}
          </h2>
          <p class="mt-1 text-xs leading-relaxed text-base-content/60">
            {{ guide.description }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
