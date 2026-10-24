<script setup lang="ts">
import { guides } from '#shared/data/guides'

useSeoMeta({
  title: 'Typing Guides',
  description: 'Practical guides on typing speed, accuracy, touch typing, keyboard layouts, and daily practice.',
  robots: 'index,follow',
})
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-12">
    <h1 class="text-3xl font-semibold">Typing guides</h1>
    <p class="mt-2 text-base-content/60">Short, practical articles that pair with a typing test preset.</p>
    <div class="mt-8 space-y-3">
      <NuxtLink
        v-for="guide in guides"
        :key="guide.slug"
        :to="`/learn/${guide.slug}`"
        class="block rounded-box border border-base-300 bg-base-200/40 p-4 transition hover:border-primary"
      >
        <h2 class="font-medium">{{ guide.title }}</h2>
        <p class="mt-1 text-sm text-base-content/60">{{ guide.description }}</p>
        <p class="mt-2 text-xs opacity-40">{{ guide.minutes }} min read</p>
      </NuxtLink>
    </div>
  </div>
</template>

