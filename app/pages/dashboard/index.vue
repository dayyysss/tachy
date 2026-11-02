<script setup lang="ts">
definePageMeta({ middleware: 'member' })

import { localDate } from '#shared/utils/dates'
import { achievements } from '#shared/config/achievements'
import { xpForLevel } from '#shared/config/xp'
import {
  Trophy,
  Flame,
  Zap,
  Clock,
  Target,
  Award,
  TrendingUp,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Activity,
  BarChart3,
  ArrowRight,
  Layers,
  History,
} from 'lucide-vue-next'

useSeo('dashboard')
const store = useTestStore()
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { user } = useAuth()

const today = computed(() => localDate())
const todayTests = computed(() => store.history.filter(entry => localDate(new Date(entry.createdAt)) === today.value))

const stats = computed(() => {
  const tests = store.history
  const avg = tests.length ? tests.reduce((sum, entry) => sum + entry.wpm, 0) / tests.length : 0
  const best = tests.length ? Math.max(...tests.map(entry => entry.wpm)) : 0
  const accuracy = tests.length ? tests.reduce((sum, entry) => sum + entry.accuracy, 0) / tests.length : 0
  return { avg, best, accuracy }
})

const remote = ref<{
  today: { tests: number; words: number; timeMs: number; avgWpm: number; bestWpm: number; avgAccuracy: number } | null
  progress: { delta: number; label: string; baselineWpm: number } | null
  totals: {
    tests: number
    words: number
    chars: number
    timeMs: number
    xp: number
    level: number
    streak: number
    longestStreak: number
    topWpm: number
    avgConsistency: number
  } | null
  week: { tests: number; words: number } | null
  achievements: { id: string; unlockedAt: string }[]
} | null>(null)

const bests = ref<{ configKey: string; wpm: number; accuracy: number; achievedAt: string }[]>([])
const progress = ref<{ date: string; wpm: number; accuracy: number; tests: number }[]>([])
const weakKeys = ref<{ key: string; total: number; errors: number; rate: number }[]>([])
const serverHistory = ref<{ id: string; wpm: number; accuracy: number; mode: string; language: string; createdAt: string }[]>([])

const recent = computed(() => store.history.slice(0, 10))
const displayHistory = computed(() => (serverHistory.value.length ? serverHistory.value.slice(0, 10) : recent.value))

// Consolidated totals (remote when logged in, local fallback when guest)
const currentTotals = computed(() => {
  if (remote.value?.totals) return remote.value.totals
  const tests = store.history
  const totalWords = tests.reduce((s, t) => s + (t.wordsTyped || 0), 0)
  const totalTime = tests.reduce((s, t) => s + (t.durationMs || 0), 0)
  const topWpm = tests.length ? Math.max(...tests.map(t => t.wpm)) : 0
  return {
    tests: tests.length,
    words: totalWords,
    chars: totalWords * 5,
    timeMs: totalTime,
    xp: 0,
    level: 0,
    streak: 0,
    longestStreak: 0,
    topWpm: Math.round(topWpm),
    avgConsistency: 0,
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

const goals = computed(() => settings.value.goals ?? { dailyTests: 10, targetWpm: 60 })
const testGoalProgress = computed(() => Math.min(100, Math.round((todaySummary.value.tests / Math.max(1, goals.value.dailyTests)) * 100)))
const wpmGoalProgress = computed(() => Math.min(100, Math.round((todaySummary.value.avgWpm / Math.max(1, goals.value.targetWpm)) * 100)))

// Format total active typing time
function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours > 0) return `${hours}h ${mins}m`
  if (mins > 0) return `${mins}m`
  return `${Math.round(ms / 1000)}s`
}

// Typist Speed & Rank Tier
const typistTier = computed(() => {
  const peak = Math.max(currentTotals.value.topWpm, todaySummary.value.bestWpm, stats.value.best)
  if (peak >= 140) return { title: 'Transcendent', tier: 'S+', badgeClass: 'bg-primary/20 text-primary border-primary/40', rankName: 'Top 0.5%' }
  if (peak >= 120) return { title: 'Tachy Master', tier: 'S', badgeClass: 'bg-primary/20 text-primary border-primary/30', rankName: 'Top 2%' }
  if (peak >= 100) return { title: 'Hyper Typist', tier: 'A+', badgeClass: 'bg-accent/20 text-accent border-accent/40', rankName: 'Top 5%' }
  if (peak >= 80) return { title: 'Speed Demon', tier: 'A', badgeClass: 'bg-accent/20 text-accent border-accent/30', rankName: 'Top 15%' }
  if (peak >= 60) return { title: 'Swift Operator', tier: 'B+', badgeClass: 'bg-info/20 text-info border-info/30', rankName: 'Top 35%' }
  if (peak >= 40) return { title: 'Adept Typist', tier: 'B', badgeClass: 'bg-base-300 text-base-content/80 border-base-content/20', rankName: 'Top 60%' }
  return { title: 'Novice Scribe', tier: 'C', badgeClass: 'bg-base-300 text-base-content/60 border-base-content/20', rankName: 'Rookie' }
})

// XP Level Progress
const xpProgress = computed(() => {
  const currentLvl = currentTotals.value.level
  const currentXp = currentTotals.value.xp
  const baseForCurrent = xpForLevel(currentLvl)
  const nextTarget = xpForLevel(currentLvl + 1)
  const required = nextTarget - baseForCurrent
  const currentInLvl = currentXp - baseForCurrent
  const pct = required > 0 ? Math.min(100, Math.max(0, Math.round((currentInLvl / required) * 100))) : 0
  return {
    level: currentLvl,
    currentXp,
    currentInLvl,
    required,
    pct,
  }
})

// Reading / Writing Equivalency
const bookEquiv = computed(() => {
  const words = currentTotals.value.words
  if (words >= 80000) return `${(words / 80000).toFixed(1)} novel(s) typed`
  if (words >= 500) return `~${Math.round(words / 250)} printed pages`
  return `${words.toLocaleString()} words`
})

// Hand Balance Calculation
const handBalance = computed(() => {
  let left = 0
  let right = 0
  const leftSet = new Set('qwertasdfgzxcvb12345')
  const rightSet = new Set('yuiophjklnm67890-=[];\',./')
  for (const item of weakKeys.value) {
    const k = item.key.toLowerCase()
    if (leftSet.has(k)) left += item.total
    else if (rightSet.has(k)) right += item.total
  }
  const total = left + right
  if (!total) return { left: 51, right: 49 }
  const leftPct = Math.max(30, Math.min(70, Math.round((left / total) * 100)))
  return { left: leftPct, right: 100 - leftPct }
})

const unlockedSet = computed(() => new Set(remote.value?.achievements?.map(a => a.id) ?? []))

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
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 py-8 space-y-8">
    <!-- 1. USER PROFILE & TIERS BANNER -->
    <div
      v-if="user"
      class="rounded-3xl border border-base-300 bg-base-200/40 p-6 sm:p-8 backdrop-blur-md shadow-sm relative overflow-hidden"
    >
      <!-- Background subtle gradient circle -->
      <div class="absolute -right-16 -top-16 size-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <!-- User identity -->
        <div class="flex items-start sm:items-center gap-4">
          <NuxtLink
            to="/settings"
            class="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-primary/25 to-base-300 border border-primary/40 flex items-center justify-center text-primary font-mono font-bold text-2xl sm:text-3xl shadow-inner shrink-0 overflow-hidden relative group cursor-pointer"
            title="Change profile photo in settings"
          >
            <img v-if="user.image" :src="user.image" :alt="user.username || user.name" class="h-full w-full object-cover">
            <span v-else>{{ (user.username || user.name || 'T')[0]?.toUpperCase() }}</span>
            <div class="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-sans font-medium">
              Change
            </div>
          </NuxtLink>
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
                {{ user.username || user.name }}
              </h1>
              <span
                class="rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide"
                :class="typistTier.badgeClass"
              >
                {{ typistTier.title }} · {{ typistTier.tier }}
              </span>
            </div>
            <p class="text-xs text-base-content/50 font-mono">
              {{ user.email }} · <span class="text-primary">{{ typistTier.rankName }}</span>
            </p>

            <!-- Level & XP Progress Bar -->
            <div class="pt-2 max-w-md">
              <div class="flex items-center justify-between text-[11px] font-mono mb-1">
                <span class="font-semibold text-base-content">Level {{ xpProgress.level }}</span>
                <span class="text-base-content/50">{{ xpProgress.currentXp.toLocaleString() }} XP · Next at {{ (xpProgress.level + 1) * (xpProgress.level + 1) * 50 }} XP</span>
              </div>
              <div class="h-2 w-full rounded-full bg-base-300/80 overflow-hidden p-0.5">
                <div
                  class="h-full rounded-full bg-primary transition-all duration-500"
                  :style="{ width: `${xpProgress.pct}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Summary Metrics Pill Grid -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="rounded-2xl border border-base-300/80 bg-base-100/70 px-4 py-3 text-center min-w-[100px] shadow-xs">
            <div class="flex items-center justify-center gap-1.5 text-warning font-mono text-xs">
              <Flame class="size-4 fill-warning" />
              <span class="font-bold text-lg text-base-content tabular-nums">{{ currentTotals.streak }}</span>
            </div>
            <span class="text-[10px] text-base-content/50 font-mono uppercase tracking-wider">Day Streak</span>
          </div>

          <div class="rounded-2xl border border-base-300/80 bg-base-100/70 px-4 py-3 text-center min-w-[100px] shadow-xs">
            <p class="font-mono text-lg font-bold text-primary tabular-nums">{{ currentTotals.topWpm }}</p>
            <span class="text-[10px] text-base-content/50 font-mono uppercase tracking-wider">Peak WPM</span>
          </div>

          <div class="rounded-2xl border border-base-300/80 bg-base-100/70 px-4 py-3 text-center min-w-[100px] shadow-xs">
            <p class="font-mono text-lg font-bold text-base-content tabular-nums">{{ currentTotals.tests }}</p>
            <span class="text-[10px] text-base-content/50 font-mono uppercase tracking-wider">Tests Taken</span>
          </div>
        </div>
      </div>
    </div>

    <!-- GUEST NOTICE (Only when not logged in) -->
    <div
      v-else
      class="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div>
        <span class="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase">
          Guest Mode
        </span>
        <h2 class="mt-2 text-xl font-bold text-base-content">You are browsing local session analytics</h2>
        <p class="mt-1 text-xs text-base-content/60 max-w-xl">
          Your tests are temporarily cached in your browser. Create a free Tachy account to unlock lifetime cloud sync, XP levels, and verified leaderboard ranking.
        </p>
      </div>
      <NuxtLink to="/login" class="btn btn-primary btn-sm px-5 font-semibold shrink-0 shadow-xs">
        <span>Sign In / Create Account</span>
        <ArrowRight class="size-4" />
      </NuxtLink>
    </div>

    <!-- 2. CORE STATS BENTO GRID -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Card 1: Words Typed -->
      <Motion
        as="div"
        class="rounded-2xl border border-base-300/80 bg-base-200/50 p-5 space-y-1 shadow-xs transition-colors hover:border-primary/40"
        :while-hover="{ y: -2, transition: { duration: 0.15 } }"
      >
        <div class="flex items-center justify-between text-base-content/40 mb-2">
          <span class="font-mono text-[11px] uppercase tracking-wider font-semibold">Total Words</span>
          <BookOpen class="size-4 text-primary" />
        </div>
        <p class="font-mono text-3xl sm:text-4xl font-bold text-base-content tabular-nums tracking-tight">
          {{ currentTotals.words.toLocaleString() }}
        </p>
        <p class="font-mono text-xs text-base-content/50 pt-1">
          {{ bookEquiv }}
        </p>
      </Motion>

      <!-- Card 2: Time in Motion -->
      <Motion
        as="div"
        class="rounded-2xl border border-base-300/80 bg-base-200/50 p-5 space-y-1 shadow-xs transition-colors hover:border-primary/40"
        :while-hover="{ y: -2, transition: { duration: 0.15 } }"
      >
        <div class="flex items-center justify-between text-base-content/40 mb-2">
          <span class="font-mono text-[11px] uppercase tracking-wider font-semibold">Time in Flow</span>
          <Clock class="size-4 text-primary" />
        </div>
        <p class="font-mono text-3xl sm:text-4xl font-bold text-base-content tabular-nums tracking-tight">
          {{ formatDuration(currentTotals.timeMs) }}
        </p>
        <p class="font-mono text-xs text-base-content/50 pt-1">
          {{ currentTotals.chars.toLocaleString() }} keystrokes registered
        </p>
      </Motion>

      <!-- Card 3: Speed Overview -->
      <Motion
        as="div"
        class="rounded-2xl border border-base-300/80 bg-base-200/50 p-5 space-y-1 shadow-xs transition-colors hover:border-primary/40"
        :while-hover="{ y: -2, transition: { duration: 0.15 } }"
      >
        <div class="flex items-center justify-between text-base-content/40 mb-2">
          <span class="font-mono text-[11px] uppercase tracking-wider font-semibold">Speed Averages</span>
          <Zap class="size-4 text-primary" />
        </div>
        <p class="font-mono text-3xl sm:text-4xl font-bold text-primary tabular-nums tracking-tight">
          {{ Math.round(todaySummary.avgWpm || stats.avg) }} <span class="text-sm font-normal text-base-content/60">WPM</span>
        </p>
        <p class="font-mono text-xs text-base-content/50 pt-1">
          Peak record: <span class="text-base-content font-bold">{{ Math.round(todaySummary.bestWpm || currentTotals.topWpm) }} WPM</span>
        </p>
      </Motion>

      <!-- Card 4: Rhythm & Accuracy -->
      <Motion
        as="div"
        class="rounded-2xl border border-base-300/80 bg-base-200/50 p-5 space-y-1 shadow-xs transition-colors hover:border-primary/40"
        :while-hover="{ y: -2, transition: { duration: 0.15 } }"
      >
        <div class="flex items-center justify-between text-base-content/40 mb-2">
          <span class="font-mono text-[11px] uppercase tracking-wider font-semibold">Accuracy & Rhythm</span>
          <ShieldCheck class="size-4 text-primary" />
        </div>
        <p class="font-mono text-3xl sm:text-4xl font-bold text-base-content tabular-nums tracking-tight">
          {{ Math.round(todaySummary.avgAccuracy || stats.accuracy) }}%
        </p>
        <p class="font-mono text-xs text-base-content/50 pt-1">
          Consistency index: <span class="text-base-content font-semibold">{{ currentTotals.avgConsistency || 85 }}%</span>
        </p>
      </Motion>
    </div>

    <!-- 3. TRAINING BENCHMARKS & ERGONOMICS (Unique to Tachy) -->
    <div class="grid gap-4 lg:grid-cols-3">
      <!-- Daily Goals Progress Rings -->
      <div class="rounded-2xl border border-base-300/80 bg-base-200/30 p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-base-300/60 pb-3">
          <h2 class="text-sm font-bold flex items-center gap-2">
            <Target class="size-4 text-primary" />
            <span>Daily Training Goals</span>
          </h2>
          <NuxtLink to="/settings" class="text-[11px] font-mono text-primary hover:underline">Adjust</NuxtLink>
        </div>

        <div class="flex items-center justify-around gap-4 text-center py-2">
          <div>
            <div class="radial-progress text-primary font-mono text-sm font-bold shadow-xs" :style="{ '--value': testGoalProgress }" role="progressbar">
              {{ testGoalProgress }}%
            </div>
            <p class="mt-2 font-mono text-xs text-base-content font-medium">Tests Target</p>
            <p class="text-[10px] font-mono text-base-content/50">{{ todaySummary.tests }} / {{ goals.dailyTests }} completed</p>
          </div>

          <div>
            <div class="radial-progress text-accent font-mono text-sm font-bold shadow-xs" :style="{ '--value': wpmGoalProgress }" role="progressbar">
              {{ wpmGoalProgress }}%
            </div>
            <p class="mt-2 font-mono text-xs text-base-content font-medium">Speed Target</p>
            <p class="text-[10px] font-mono text-base-content/50">{{ Math.round(todaySummary.avgWpm) }} / {{ goals.targetWpm }} WPM</p>
          </div>
        </div>
      </div>

      <!-- Hand Ergonomics Balance (Unique Feature) -->
      <div class="rounded-2xl border border-base-300/80 bg-base-200/30 p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-base-300/60 pb-3">
          <h2 class="text-sm font-bold flex items-center gap-2">
            <Layers class="size-4 text-primary" />
            <span>Hand Load Ergonomics</span>
          </h2>
          <span class="text-[11px] font-mono text-base-content/40">QWERTY</span>
        </div>

        <div class="space-y-3 py-1">
          <div class="flex justify-between items-center text-xs font-mono">
            <span class="flex items-center gap-1.5 font-semibold text-primary">
              <span class="size-2 rounded-full bg-primary" /> Left: {{ handBalance.left }}%
            </span>
            <span class="flex items-center gap-1.5 font-semibold text-accent">
              Right: {{ handBalance.right }}% <span class="size-2 rounded-full bg-accent" />
            </span>
          </div>

          <div class="h-3 w-full rounded-full bg-base-300/80 overflow-hidden flex p-0.5">
            <div class="h-full rounded-l-full bg-primary transition-all duration-300" :style="{ width: `${handBalance.left}%` }" />
            <div class="h-full rounded-r-full bg-accent transition-all duration-300" :style="{ width: `${handBalance.right}%` }" />
          </div>

          <p class="text-[11px] text-base-content/50 font-mono leading-relaxed">
            Measures mechanical keystroke distribution across both hands to prevent repetitive single-hand strain.
          </p>
        </div>
      </div>

      <!-- Speed Diagnostics & Insights -->
      <div class="rounded-2xl border border-base-300/80 bg-base-200/30 p-5 space-y-3">
        <div class="flex items-center justify-between border-b border-base-300/60 pb-3">
          <h2 class="text-sm font-bold flex items-center gap-2">
            <Activity class="size-4 text-primary" />
            <span>Real-Time Diagnostics</span>
          </h2>
          <span v-if="remote?.progress" class="badge badge-xs" :class="remote.progress.delta > 2 ? 'badge-success' : 'badge-ghost'">
            {{ remote.progress.label }}
          </span>
        </div>

        <div class="space-y-2 text-xs font-mono text-base-content/70">
          <div v-if="remote?.progress" class="p-2.5 rounded-xl bg-base-100/60 border border-base-300/60">
            {{ remote.progress.delta > 0 ? '▲' : '▼' }} {{ Math.abs(Math.round(remote.progress.delta)) }}% vs 7-day average ({{ Math.round(remote.progress.baselineWpm) }} WPM).
          </div>
          <div v-if="weakKeys.length" class="p-2.5 rounded-xl bg-base-100/60 border border-base-300/60">
            Frequent mistake: key <span class="text-error font-bold font-mono">“{{ weakKeys[0]!.key }}”</span> ({{ weakKeys[0]!.rate.toFixed(1) }}% error rate).
          </div>
          <div v-else class="p-2.5 rounded-xl bg-base-100/60 border border-base-300/60 text-base-content/50">
            No recurring error keys detected yet. Keep typing to populate telemetry.
          </div>
        </div>
      </div>
    </div>

    <!-- 4. KEYBOARD WEAK KEYS HEATMAP -->
    <div v-if="weakKeys.length" class="rounded-2xl border border-base-300 bg-base-200/30 p-5 space-y-3">
      <div class="flex items-center justify-between border-b border-base-300/60 pb-3">
        <h2 class="text-sm font-bold flex items-center gap-2">
          <span>Accuracy Problem Keys</span>
        </h2>
        <span class="text-xs text-base-content/40 font-mono">Keys with highest misfire rates</span>
      </div>
      <div class="flex flex-wrap gap-2 pt-1">
        <div
          v-for="item in weakKeys"
          :key="item.key"
          class="rounded-xl border px-3 py-1.5 font-mono text-xs flex items-center gap-2 shadow-xs"
          :class="item.rate > 10 ? 'border-error/40 bg-error/10 text-error font-bold' : item.rate > 5 ? 'border-warning/40 bg-warning/10 text-warning font-semibold' : 'border-base-300 bg-base-100 text-base-content/70'"
        >
          <span class="text-sm">{{ item.key === ' ' ? '␣ Space' : item.key }}</span>
          <span class="text-[10px] opacity-75">{{ item.rate.toFixed(1) }}% miss</span>
        </div>
      </div>
    </div>

    <!-- 5. TACHY ACHIEVEMENT TROPHIES (Unique to Tachy) -->
    <div class="rounded-2xl border border-base-300 bg-base-200/30 p-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/60 pb-4">
        <div>
          <h2 class="text-base font-bold flex items-center gap-2">
            <Trophy class="size-4 text-warning" />
            <span>Tachy Mastery Badges</span>
          </h2>
          <p class="text-xs text-base-content/50 font-mono">Milestone trophies unlocked through speed, streaks, and discipline.</p>
        </div>
        <span class="text-xs font-mono font-semibold text-primary">
          {{ unlockedSet.size }} / {{ achievements.length }} Unlocked
        </span>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 pt-1">
        <div
          v-for="badge in achievements"
          :key="badge.id"
          class="rounded-2xl border p-3.5 flex flex-col justify-between transition-all"
          :class="unlockedSet.has(badge.id)
            ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/10'
            : 'border-base-300/70 bg-base-100/40 opacity-50 grayscale'"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-lg">
                <Award v-if="unlockedSet.has(badge.id)" class="size-5 text-primary" />
                <Lock v-else class="size-4 text-base-content/40" />
              </span>
              <span
                class="badge badge-xs font-mono text-[9px]"
                :class="unlockedSet.has(badge.id) ? 'badge-primary text-primary-content font-bold' : 'badge-ghost'"
              >
                {{ unlockedSet.has(badge.id) ? 'UNLOCKED' : badge.kind }}
              </span>
            </div>
            <p class="font-bold text-xs text-base-content tracking-tight line-clamp-1">{{ badge.label }}</p>
            <p class="text-[10px] text-base-content/60 font-sans mt-0.5 line-clamp-2 leading-tight">{{ badge.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. 30-DAY WPM PERFORMANCE CURVE -->
    <div v-if="progress.length" class="rounded-2xl border border-base-300 bg-base-200/30 p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-base-300/60 pb-3">
        <h2 class="text-sm font-bold flex items-center gap-2">
          <TrendingUp class="size-4 text-primary" />
          <span>30-Day Speed Performance Curve</span>
        </h2>
        <span class="text-xs font-mono text-base-content/40">Verified daily test trajectory</span>
      </div>
      <TrendChart :values="progress.map(point => point.wpm)" :height="150" label="WPM progression" />
    </div>

    <!-- 7. ACTIVITY HEATMAP -->
    <div class="rounded-2xl border border-base-300 bg-base-200/30 p-5 space-y-3">
      <div class="flex items-center justify-between border-b border-base-300/60 pb-3">
        <h2 class="text-sm font-bold flex items-center gap-2">
          <BarChart3 class="size-4 text-primary" />
          <span>Activity Consistency Heatmap</span>
        </h2>
        <span class="text-xs font-mono text-base-content/40">Yearly frequency</span>
      </div>
      <ActivityHeatmap :history="store.history" />
    </div>

    <!-- 8. PERSONAL BESTS & TEST REPLAYS -->
    <div v-if="bests.length" class="rounded-2xl border border-base-300 bg-base-200/30 overflow-hidden shadow-xs">
      <div class="flex items-center justify-between border-b border-base-300 px-5 py-3.5 bg-base-200/60">
        <h2 class="text-sm font-bold flex items-center gap-2">
          <Sparkles class="size-4 text-primary" />
          <span>Personal Bests by Category</span>
        </h2>
        <span class="text-xs font-mono text-base-content/50">{{ bests.length }} records</span>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-sm font-mono text-xs">
          <thead>
            <tr class="text-base-content/50 border-b border-base-300/70">
              <th>Configuration</th>
              <th>Speed (WPM)</th>
              <th>Accuracy</th>
              <th>Date Achieved</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="best in bests" :key="best.configKey" class="hover:bg-base-200/40">
              <td class="font-bold text-primary">{{ best.configKey }}</td>
              <td class="font-bold tabular-nums text-sm">{{ Math.round(best.wpm) }}</td>
              <td class="tabular-nums">{{ Math.round(best.accuracy) }}%</td>
              <td class="text-xs opacity-60">{{ new Date(best.achievedAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 9. RECENT TEST SESSIONS WITH REPLAY -->
    <div class="rounded-2xl border border-base-300 bg-base-200/30 overflow-hidden shadow-xs">
      <div class="flex items-center justify-between border-b border-base-300 px-5 py-3.5 bg-base-200/60">
        <h2 class="text-sm font-bold flex items-center gap-2">
          <History class="size-4 text-primary" />
          <span>Recent Sessions Archive</span>
        </h2>
        <NuxtLink to="/dashboard/history" class="btn btn-ghost btn-xs font-mono text-primary flex items-center gap-1">
          <span>View all history</span>
          <ArrowRight class="size-3" />
        </NuxtLink>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-sm font-mono text-xs">
          <thead>
            <tr class="text-base-content/50 border-b border-base-300/70">
              <th>WPM</th>
              <th>Accuracy</th>
              <th>Mode</th>
              <th>Language</th>
              <th>Date</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!displayHistory.length">
              <td colspan="6" class="py-8 text-center text-sm opacity-50 font-sans">
                No typing tests found. <NuxtLink to="/" class="link link-primary">Take your first test</NuxtLink>.
              </td>
            </tr>
            <tr v-for="entry in displayHistory" :key="entry.id" class="hover:bg-base-200/40">
              <td class="font-bold text-primary text-sm tabular-nums">{{ Math.round(entry.wpm) }}</td>
              <td class="tabular-nums">{{ Math.round(entry.accuracy) }}%</td>
              <td><span class="badge badge-xs border border-base-300 font-mono">{{ entry.mode }}</span></td>
              <td class="uppercase">{{ entry.language }}</td>
              <td class="text-xs opacity-60">{{ new Date(entry.createdAt).toLocaleDateString() }}</td>
              <td class="text-right">
                <NuxtLink
                  v-if="serverHistory.length"
                  :to="`/replay/${entry.id}`"
                  class="btn btn-ghost btn-xs text-primary font-mono hover:bg-primary/10"
                >
                  Replay →
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
