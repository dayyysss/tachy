<script setup lang="ts">
import { guideMap, guides } from '#shared/data/guides'

const route = useRoute()
const slug = String(route.params.slug)
const guide = guideMap.get(slug)

if (!guide) {
  throw createError({ statusCode: 404, statusMessage: 'Guide not found' })
}

useSeoMeta({
  title: `${guide.title}`,
  description: guide.description,
  ogTitle: `${guide.title}`,
  ogDescription: guide.description,
  robots: 'index,follow',
  twitterCard: 'summary_large_image',
})

const related = computed(() => guides.filter(item => item.slug !== guide.slug).slice(0, 3))
</script>

<template>
  <article class="mx-auto w-full max-w-2xl px-4 py-12">
    <nav class="mb-4 text-xs opacity-50">
      <NuxtLink to="/learn" class="hover:text-primary">Guides</NuxtLink>
      <span> / {{ guide.title }}</span>
    </nav>
    <h1 class="text-3xl font-semibold">{{ guide.title }}</h1>
    <p class="mt-2 text-base-content/60">{{ guide.description }}</p>
    <p class="mt-2 text-xs opacity-40">{{ guide.minutes }} min read</p>

    <section v-for="section in guide.sections" :key="section.heading" class="mt-8">
      <h2 class="text-xl font-semibold">{{ section.heading }}</h2>
      <p v-for="paragraph in section.paragraphs" :key="paragraph" class="mt-3 text-sm leading-6 text-base-content/75">
        {{ paragraph }}
      </p>
    </section>

    <div class="mt-10 rounded-box border border-primary/30 bg-primary/5 p-5">
      <p class="text-sm">Put it into practice with a free 60-second test.</p>
      <NuxtLink to="/" class="btn btn-primary btn-sm mt-3">Start typing</NuxtLink>
    </div>

    <section class="mt-10">
      <h2 class="text-sm font-medium uppercase tracking-wide opacity-50">Related guides</h2>
      <ul class="mt-3 space-y-2 text-sm">
        <li v-for="item in related" :key="item.slug">
          <NuxtLink :to="`/learn/${item.slug}`" class="link link-hover">{{ item.title }}</NuxtLink>
        </li>
      </ul>
    </section>
  </article>
</template>

