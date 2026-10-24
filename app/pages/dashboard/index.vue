<script setup lang="ts">
import { localDate } from '#shared/utils/dates'

useSeo('dashboard')
const store = useTestStore()
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const today = computed(() => localDate())
const todayTests = computed(() => store.history.filter(entry => localDate(new Date(entry.createdAt)) === today.value))

const stats = computed(() => {
  const tests = store.history
  const avg = tests.length ? tests.reduce((sum, entry) => sum + entry.wpm, 0) / tests.length : 0
  const best = tests.length ? Math.max(...tests.map(entry => entry.wpm)) : 0
  const accuracy = tests.length ? tests.reduce((sum, entry) => sum + entry.accuracy, 0) / tests.length : 0
  return { avg, best, accuracy }
})

const recent = computed(() => store.history.slice(0, 12))
const displayHistory = computed(() => (serverHistory.value.length ? serverHistory.value.slice(0, 12) : recent.value))

const goals = computed(() => settings.value.goals ?? { dailyTests: 10, targetWpm: 60 })
const testGoalProgress = computed(() => Math.min(100, Math.round((todaySummary.value.tests / Math.max(1, goals.value.dailyTests)) * 100)))
const wpmGoalProgress = computed(() => Math.min(100, Math.round((todaySummary.value.avgWpm / Math.max(1, goals.value.targetWpm)) * 100)))

const breakdown = computed(() => {
  const groups = { language: new Map<string, number>(), mode: new Map<string, number>(), contentType: new Map<string, number>() }
  for (const entry of displayHistory.value) {
    groups.language.set(entry.language, (groups.language.get(entry.language) ?? 0) + 1)
    groups.mode.set(entry.mode, (groups.mode.get(entry.mode) ?? 0) + 1)
    groups.contentType.set((entry as { contentType?: string }).contentType ?? 'words', (groups.contentType.get((entry as { contentType?: string }).contentType ?? 'words') ?? 0) + 1)
  }
  return groups
})

const insights = computed(() => {
  const list: string[] = []
  if (remote.value?.progress) {
    const { delta, baselineWpm } = remote.value.progress
    list.push(delta > 2
      ? `You are ${Math.abs(Math.round(delta))}% faster than your 7-day average (${Math.round(baselineWpm)} wpm).`
      : delta < -2
        ? `You are ${Math.abs(Math.round(delta))}% slower than your 7-day average — try a 30 s warm-up.`
        : `Your speed is stable against your 7-day average (${Math.round(baselineWpm)} wpm).`)
  }
  if (weakKeys.value.length) {
    const top = weakKeys.value[0]!
    list.push(`Your weakest key is “${top.key}” (${top.rate.toFixed(1)}% error rate).`)
  }
  if (todaySummary.value.tests < goals.value.dailyTests) {
    list.push(`${goals.value.dailyTests - todaySummary.value.tests} more test(s) to hit today's goal.`)
  } else {
    list.push('Daily test goal complete.')
  }
  return list
})

const remote = ref<{
  today: { tests: number; words: number; timeMs: number; avgWpm: number; bestWpm: number; avgAccuracy: number } | null
  progress: { delta: number; label: string; baselineWpm: number } | null
  totals: { tests: number; words: number; timeMs: number; xp: number; level: number; streak: number; longestStreak: number } | null
} | null>(null)

const bests = ref<{ configKey: string; wpm: number; accuracy: number; achievedAt: string }[]>([])
const progress = ref<{ date: string; wpm: number; accuracy: number; tests: number }[]>([])
const weakKeys = ref<{ key: string; total: number; errors: number; rate: number }[]>([])
const serverHistory = ref<{ id: string; wpm: number; accuracy: number; mode: string; language: string; createdAt: string }[]>([])

onMounted(async () => {
  try {
    remote.value = await $fetch('/api/me/overview')
    const [pb, trend, weak, history] = await Promise.all([
      $fetch<{ rows: typeof bests.value }>('/api/me/personal-bests'),
      $fetch<{ points: typeof progress.value }>('/api/me/progress', { query: { range: 30 } }),
      $fetch<{ keys: typeof weakKeys.value }>('/api/me/weak-keys'),
      $fetch<{ rows: typeof serverHistory.value }>('/api/me/history'),
    ])
    bests.value = pb.rows
    progress.value = trend.points
    weakKeys.value = weak.keys
    serverHistory.value = history.rows
  } catch {
    // guests and unconfigured deployments fall back to local history
  }
})

const todaySummary = computed(() => remote.value?.today ?? {
  tests: todayTests.value.length,
  words: todayTests.value.reduce((sum, entry) => sum + entry.wordsTyped, 0),
  timeMs: todayTests.value.reduce((sum, entry) => sum + entry.durationMs, 0),
  avgWpm: todayTests.value.length ? todayTests.value.reduce((sum, entry) => sum + entry.wpm, 0) / todayTests.value.length : 0,
  bestWpm: todayTests.value.length ? Math.max(...todayTests.value.map(entry => entry.wpm)) : 0,
  avgAccuracy: todayTests.value.length ? todayTests.value.reduce((sum, entry) => sum + entry.accuracy, 0) / todayTests.value.length : 0,
})
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">{{ remote?.totals ? 'Your Typing Analytics' : $t('dashboard.guestTitle') }}</h1>
        <p class="text-sm text-base-content/50">{{ remote?.totals ? 'Lifetime speed metrics, streaks, and weakness diagnostics.' : $t('dashboard.guestHint') }}</p>
      </div>
      <NuxtLink v-if="!remote?.totals" to="/login" class="btn btn-primary btn-sm">Sign in</NuxtLink>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard :label="$t('dashboard.today')" :value="todaySummary.tests" hint="tests today" />
      <StatCard :label="$t('dashboard.tests')" :value="remote?.totals?.tests ?? store.history.length" :hint="remote?.totals ? `level ${remote.totals.level} · ${remote.totals.xp} xp` : 'last 50 stored'" />
      <StatCard :label="$t('dashboard.avgWpm')" :value="Math.round(remote?.totals ? stats.avg : todaySummary.avgWpm)" :hint="`best ${Math.round(todaySummary.bestWpm)} wpm`" />
      <StatCard :label="$t('dashboard.accuracy')" :value="`${Math.round(todaySummary.avgAccuracy)}%`" hint="today" />
    </div>

    <div v-if="remote?.progress" class="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <span class="badge" :class="remote.progress.delta > 2 ? 'badge-success' : remote.progress.delta < -2 ? 'badge-error' : 'badge-ghost'">
        {{ remote.progress.label }} {{ Math.abs(Math.round(remote.progress.delta)) }}%
      </span>
      <span class="opacity-60">vs 7-day average {{ Math.round(remote.progress.baselineWpm) }} wpm</span>
      <span v-if="remote.totals" class="opacity-60">· streak {{ remote.totals.streak }} days · longest {{ remote.totals.longestStreak }}</span>
    </div>

    <div class="mt-4 grid gap-3 lg:grid-cols-3">
      <div class="rounded-box border border-base-300 bg-base-200/30 p-4">
        <h2 class="mb-3 text-sm font-medium">Goals</h2>
        <div class="flex items-center justify-around gap-2 text-center text-xs">
          <div>
            <div class="radial-progress text-primary font-mono text-sm font-semibold" :style="{ '--value': testGoalProgress }" role="progressbar">{{ testGoalProgress }}%</div>
            <p class="mt-1 font-mono text-xs opacity-60">tests {{ todaySummary.tests }}/{{ goals.dailyTests }}</p>
          </div>
          <div>
            <div class="radial-progress text-accent font-mono text-sm font-semibold" :style="{ '--value': wpmGoalProgress }" role="progressbar">{{ wpmGoalProgress }}%</div>
            <p class="mt-1 font-mono text-xs opacity-60">wpm {{ Math.round(todaySummary.avgWpm) }}/{{ goals.targetWpm }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-box border border-base-300 bg-base-200/30 p-4 lg:col-span-2">
        <h2 class="mb-2 text-sm font-medium">Insights</h2>
        <ul class="space-y-1 text-sm opacity-70">
          <li v-for="insight in insights" :key="insight">· {{ insight }}</li>
        </ul>
        <div v-if="displayHistory.length" class="mt-3 flex flex-wrap gap-1 text-xs">
          <span v-for="[language, count] in breakdown.language" :key="language" class="badge badge-ghost">{{ language }} {{ count }}</span>
          <span v-for="[mode, count] in breakdown.mode" :key="mode" class="badge badge-ghost">{{ mode }} {{ count }}</span>
        </div>
      </div>
    </div>


    <div class="mt-4">
      <ActivityHeatmap :history="store.history" />
    </div>

    <div v-if="weakKeys.length" class="mt-4 rounded-box border border-base-300 bg-base-200/30 p-4">
      <h2 class="mb-2 text-sm font-medium">Weak keys</h2>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="item in weakKeys"
          :key="item.key"
          class="badge badge-sm"
          :class="item.rate > 10 ? 'badge-error' : item.rate > 5 ? 'badge-warning' : 'badge-ghost'"
          :title="`${item.errors}/${item.total} errors`"
        >{{ item.key }} {{ item.rate.toFixed(1) }}%</span>
      </div>
    </div>

    <div v-if="progress.length" class="mt-4 rounded-box border border-base-300 bg-base-200/30 p-4">
      <h2 class="mb-2 text-sm font-medium">30-day WPM trend</h2>
      <TrendChart :values="progress.map(point => point.wpm)" :height="140" label="WPM trend" />
    </div>

    <div v-if="bests.length" class="mt-4 rounded-box border border-base-300 bg-base-200/30">
      <h2 class="border-b border-base-300 px-4 py-3 text-sm font-medium">Personal bests</h2>
      <table class="table table-sm">
        <thead><tr><th>Category</th><th>WPM</th><th>Accuracy</th><th>Date</th></tr></thead>
        <tbody>
          <tr v-for="best in bests" :key="best.configKey">
            <td class="font-mono text-xs">{{ best.configKey }}</td>
            <td class="font-semibold tabular-nums">{{ Math.round(best.wpm) }}</td>
            <td class="tabular-nums">{{ Math.round(best.accuracy) }}%</td>
            <td class="text-xs opacity-60">{{ new Date(best.achievedAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-6 rounded-box border border-base-300 bg-base-200/30">
      <div class="flex items-center justify-between border-b border-base-300 px-4 py-3">
        <h2 class="text-sm font-medium">{{ $t('dashboard.history') }}</h2>
        <NuxtLink to="/dashboard/history" class="link link-hover text-xs">All tests</NuxtLink>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>WPM</th>
              <th>Accuracy</th>
              <th>Mode</th>
              <th>Lang</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!displayHistory.length">
              <td colspan="5" class="py-6 text-center text-sm opacity-50">No tests yet. <NuxtLink to="/" class="link">Take one</NuxtLink>.</td>
            </tr>
            <tr v-for="entry in displayHistory" :key="entry.id">
              <td class="font-semibold tabular-nums">
                <NuxtLink v-if="serverHistory.length" :to="`/replay/${entry.id}`" class="link link-hover">{{ Math.round(entry.wpm) }}</NuxtLink>
                <span v-else>{{ Math.round(entry.wpm) }}</span>
              </td>
              <td class="tabular-nums">{{ Math.round(entry.accuracy) }}%</td>
              <td>{{ entry.mode }}</td>
              <td class="uppercase">{{ entry.language }}</td>
              <td class="text-xs opacity-60">{{ new Date(entry.createdAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
