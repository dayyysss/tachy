<script setup lang="ts">
import type { PublicStats } from '#shared/types/test'

useSeo('about')

const { data } = await useFetch<PublicStats>('/api/stats/global', {
  default: () => ({ tests: 0, words: 0, timeMs: 0, users: 0 }),
})

const stats = computed(() => [
  { label: 'Tests completed', value: data.value.tests.toLocaleString() },
  { label: 'Words typed', value: data.value.words.toLocaleString() },
  { label: 'Time typed', value: `${Math.round(data.value.timeMs / 3600000).toLocaleString()} h` },
  { label: 'Registered typists', value: data.value.users.toLocaleString() },
])
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-12 space-y-10">
    <!-- Hero Header -->
    <div class="rounded-2xl border border-base-300 bg-base-200/50 p-6 sm:p-10 shadow-xs">
      <span class="rounded-full bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
        Minimalist Typing Platform
      </span>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
        About Tachy
      </h1>
      <p class="mt-3 text-sm leading-relaxed text-base-content/70 sm:text-base">
        Tachy (from the Greek <em>tachys</em>, meaning swift) is an ultra-clean, distraction-free typing platform designed
        for typists, developers, and writers. No ads, no bloated trackers, and instant practice as a guest or synced account.
      </p>
      <div class="mt-6 flex gap-3">
        <NuxtLink to="/" class="btn btn-primary btn-sm px-5 font-semibold shadow-xs">Start Typing →</NuxtLink>
        <NuxtLink to="/leaderboard" class="btn btn-ghost btn-sm border border-base-300">View Leaderboards</NuxtLink>
      </div>
    </div>

    <!-- Live Community Numbers -->
    <div>
      <h2 class="text-xs font-mono font-semibold uppercase tracking-widest text-base-content/40 mb-3">Live Global Statistics</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Motion
          v-for="(item, idx) in stats"
          :key="item.label"
          as="div"
          class="rounded-box border border-base-300/80 bg-base-200/40 p-4 font-mono transition-colors"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.2, delay: idx * 0.05 }"
          :while-hover="{ y: -2, transition: { duration: 0.15 } }"
        >
          <p class="text-[11px] uppercase tracking-wider text-base-content/40">{{ item.label }}</p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-primary">{{ item.value }}</p>
        </Motion>
      </div>
    </div>

    <!-- Metrics Explanation -->
    <div class="grid gap-6 sm:grid-cols-2">
      <div class="rounded-box border border-base-300 bg-base-200/30 p-6 space-y-3">
        <h3 class="text-base font-semibold text-base-content">Standardized Metric Formulas</h3>
        <p class="text-xs text-base-content/60">Tachy implements authoritative, standardized typing speed calculation:</p>
        <ul class="space-y-2 text-xs font-mono text-base-content/75">
          <li class="rounded bg-base-100 p-2.5 border border-base-300/60">
            <span class="text-primary font-bold">WPM</span> = (correctCharacters ÷ 5) ÷ minutes
          </li>
          <li class="rounded bg-base-100 p-2.5 border border-base-300/60">
            <span class="text-primary font-bold">Raw WPM</span> = (totalTypedCharacters ÷ 5) ÷ minutes
          </li>
          <li class="rounded bg-base-100 p-2.5 border border-base-300/60">
            <span class="text-primary font-bold">Accuracy</span> = correctKeypresses ÷ totalKeypresses
          </li>
          <li class="rounded bg-base-100 p-2.5 border border-base-300/60">
            <span class="text-primary font-bold">Consistency</span> = 100 × (1 − σ ÷ μ) per second
          </li>
        </ul>
      </div>

      <div class="rounded-box border border-base-300 bg-base-200/30 p-6 space-y-4 flex flex-col justify-between">
        <div>
          <h3 class="text-base font-semibold text-base-content">Replay-Verified Fair Play</h3>
          <p class="mt-2 text-xs leading-relaxed text-base-content/70">
            Every ranked test submission records full keystroke timestamp telemetry. When submitting to leaderboards,
            the server re-simulates the exact session with identical deterministic RNG seeds. Bot-like millisecond
            intervals and impossible speeds are rejected automatically.
          </p>
        </div>

        <div class="border-t border-base-300 pt-4">
          <h4 class="text-xs font-semibold text-base-content">Privacy & Guest Independence</h4>
          <p class="mt-1 text-xs text-base-content/60">
            Practice without registration. Your last 50 tests and custom preferences stay safely in your browser.
            When you register, you can import your offline history in one click.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
