<script setup lang="ts">
import type { HistoryEntry } from '#shared/types/test'

const route = useRoute()
const username = String(route.params.username)

const { data, error } = await useFetch<{
  username: string
  displayName?: string
  image?: string | null
  level: number
  xp: number
  currentStreak: number
  longestStreak: number
  totalTests: number
  totalWords: number
  bestWpm: number
  isPublic: boolean
  personalBests: { configKey: string; wpm: number; accuracy: number; achievedAt: string }[]
  achievements: { id: string; label: string; description: string; unlockedAt: string }[]
  daily: { localDate: string; testsCount: number; wordsTyped: number; bestWpm: number }[]
}>(`/api/u/${encodeURIComponent(username)}`)

if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
}

const profile = computed(() => data.value)

const heatmapHistory = computed<HistoryEntry[]>(() => {
  if (!profile.value?.daily) return []
  return profile.value.daily.map((d, index) => ({
    id: `daily-${index}`,
    createdAt: new Date(`${d.localDate}T12:00:00Z`).getTime(),
    wpm: d.bestWpm,
    rawWpm: d.bestWpm,
    accuracy: 100,
    consistency: 100,
    language: 'en',
    contentType: 'words',
    mode: 'time',
    amount: 60,
    durationMs: 60000,
    wordsTyped: d.wordsTyped,
  }))
})

useSeoMeta({
  title: () => profile.value ? `${profile.value.username} — Typing Profile` : 'Typing Profile',
  description: () => profile.value ? `${profile.value.username}: level ${profile.value.level}, best ${Math.round(profile.value.bestWpm)} WPM.` : 'Public typing profile.',
  robots: () => profile.value?.isPublic ? 'index,follow' : 'noindex,nofollow',
})
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-12">
    <div v-if="profile" class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-primary/25 to-base-300 border border-primary/40 flex items-center justify-center text-primary font-mono font-bold text-2xl sm:text-3xl shadow-inner shrink-0 overflow-hidden">
            <img v-if="profile.image" :src="profile.image" :alt="profile.displayName || profile.username" class="h-full w-full object-cover">
            <span v-else>{{ (profile.displayName || profile.username || 'T')[0]?.toUpperCase() }}</span>
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-semibold">{{ profile.displayName || profile.username }}</h1>
            <p class="text-sm opacity-50 font-mono">@{{ profile.username }}</p>
          </div>
        </div>
        <div class="text-right text-xs opacity-60 font-mono">
          <p>Current streak: <strong class="text-primary">{{ profile.currentStreak }}d</strong></p>
          <p>Longest streak: {{ profile.longestStreak }}d</p>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-4">
        <Motion
          as="div"
          class="rounded-box border border-base-300/80 bg-base-200/50 p-4 font-mono transition-colors"
          :while-hover="{ y: -2, transition: { duration: 0.15 } }"
        >
          <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/40">Level ({{ profile.xp }} XP)</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums text-primary">{{ profile.level }}</p>
        </Motion>
        <Motion
          as="div"
          class="rounded-box border border-base-300/80 bg-base-200/50 p-4 font-mono transition-colors"
          :while-hover="{ y: -2, transition: { duration: 0.15 } }"
        >
          <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/40">Best WPM</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums text-primary">{{ Math.round(profile.bestWpm) }}</p>
        </Motion>
        <Motion
          as="div"
          class="rounded-box border border-base-300/80 bg-base-200/50 p-4 font-mono transition-colors"
          :while-hover="{ y: -2, transition: { duration: 0.15 } }"
        >
          <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/40">Tests Completed</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums text-base-content">{{ profile.totalTests }}</p>
        </Motion>
        <Motion
          as="div"
          class="rounded-box border border-base-300/80 bg-base-200/50 p-4 font-mono transition-colors"
          :while-hover="{ y: -2, transition: { duration: 0.15 } }"
        >
          <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/40">Words Typed</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums text-base-content">{{ profile.totalWords.toLocaleString() }}</p>
        </Motion>
      </div>

      <div>
        <h2 class="mb-2 text-sm font-medium uppercase tracking-wide opacity-50">Activity</h2>
        <ActivityHeatmap :history="heatmapHistory" />
      </div>

      <div v-if="profile.achievements.length">
        <h2 class="mb-2 text-sm font-medium uppercase tracking-wide opacity-50">Badges & Achievements ({{ profile.achievements.length }})</h2>
        <div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <div v-for="ach in profile.achievements" :key="ach.id" class="rounded-box border border-base-300 bg-base-200/30 p-3">
            <p class="font-medium text-sm text-primary">{{ ach.label }}</p>
            <p class="text-xs opacity-60">{{ ach.description }}</p>
          </div>
        </div>
      </div>

      <div v-if="profile.personalBests.length" class="rounded-box border border-base-300 bg-base-200/30">
        <h2 class="border-b border-base-300 px-4 py-3 text-sm font-medium uppercase tracking-wide opacity-50">Personal Bests</h2>
        <table class="table table-sm">
          <thead><tr><th>Category</th><th>WPM</th><th>Accuracy</th><th>Date</th></tr></thead>
          <tbody>
            <tr v-for="pb in profile.personalBests" :key="pb.configKey">
              <td class="font-mono text-xs">{{ pb.configKey }}</td>
              <td class="font-semibold tabular-nums">{{ Math.round(pb.wpm) }}</td>
              <td class="tabular-nums">{{ Math.round(pb.accuracy) }}%</td>
              <td class="text-xs opacity-60">{{ new Date(pb.achievedAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="rounded-box border border-base-300 p-6 text-center text-sm opacity-60">
      This profile is not available.
    </div>
  </div>
</template>

