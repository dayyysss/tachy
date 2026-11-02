<script setup lang="ts">
import { guideMap, guides } from '#shared/data/guides'
import { BookOpen } from 'lucide-vue-next'

const route = useRoute()
const slug = String(route.params.slug)
const guide = guideMap.get(slug)

if (!guide) {
  throw createError({ statusCode: 404, statusMessage: 'Guide not found' })
}

useSeoMeta({
  title: `${guide.title} — Tachy Guide`,
  description: guide.description,
  ogTitle: `${guide.title}`,
  ogDescription: guide.description,
  robots: 'index,follow',
  twitterCard: 'summary_large_image',
})

const related = computed(() => guides.filter(item => item.slug !== guide.slug).slice(0, 3))
</script>

<template>
  <article class="mx-auto w-full max-w-3xl px-4 py-12 space-y-10">
    <!-- Breadcrumb -->
    <nav class="text-xs font-mono opacity-50 flex items-center gap-1.5">
      <NuxtLink to="/learn" class="hover:text-primary">Guides</NuxtLink>
      <span>/</span>
      <span class="text-base-content">{{ guide.title }}</span>
    </nav>

    <!-- Article Header -->
    <header class="border-b border-base-300 pb-8">
      <div class="inline-flex items-center gap-1.5 text-xs font-mono text-primary">
        <BookOpen class="size-3.5" />
        <span>{{ guide.minutes }} minute read</span>
      </div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">{{ guide.title }}</h1>
      <p class="mt-3 text-base text-base-content/70 leading-relaxed">{{ guide.description }}</p>
    </header>

    <!-- Article Content -->
    <div class="space-y-8">
      <section v-for="section in guide.sections" :key="section.heading" class="space-y-3">
        <h2 class="text-xl font-bold text-base-content tracking-tight">{{ section.heading }}</h2>
        <p
          v-for="(paragraph, pIndex) in section.paragraphs"
          :key="pIndex"
          class="text-sm leading-relaxed text-base-content/80"
        >
          {{ paragraph }}
        </p>
      </section>
    </div>

    <!-- Practice Callout -->
    <div class="rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h3 class="font-bold text-base text-base-content">Test Your Technique Now</h3>
        <p class="mt-0.5 text-xs text-base-content/60">Launch a quick 60-second test to apply what you just learned.</p>
      </div>
      <NuxtLink to="/" class="btn btn-primary btn-sm px-5 font-semibold shrink-0 shadow-xs">
        Start Free Test →
      </NuxtLink>
    </div>

    <!-- Related Articles -->
    <section v-if="related.length" class="border-t border-base-300 pt-8 space-y-4">
      <h2 class="text-xs font-mono font-semibold uppercase tracking-widest text-base-content/40">Related Articles</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <NuxtLink
          v-for="item in related"
          :key="item.slug"
          :to="`/learn/${item.slug}`"
          class="rounded-box border border-base-300 bg-base-200/30 p-4 transition-all hover:border-primary"
        >
          <p class="text-xs font-semibold text-base-content line-clamp-2">{{ item.title }}</p>
          <p class="mt-2 text-[10px] font-mono opacity-50">{{ item.minutes }} min read</p>
        </NuxtLink>
      </div>
    </section>
  </article>
</template>
