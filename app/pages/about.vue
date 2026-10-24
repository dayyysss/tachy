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
  <div class="mx-auto w-full max-w-3xl px-4 py-10">
    <h1 class="text-3xl font-semibold">About Tachy</h1>
    <p class="mt-3 text-base-content/70">
      Tachy is a fast, minimal typing test with progress tracking. Play instantly as a guest, then sign in
      to keep daily history, streaks, personal bests, and leaderboard ranks across devices.
    </p>

    <section class="mt-8 grid gap-3 sm:grid-cols-2">
      <div v-for="item in stats" :key="item.label" class="rounded-box border border-base-300 bg-base-200/40 p-4">
        <p class="text-2xl font-semibold tabular-nums">{{ item.value }}</p>
        <p class="text-xs uppercase tracking-wide opacity-50">{{ item.label }}</p>
      </div>
    </section>

    <section class="prose prose-invert mt-10 max-w-none">
      <h2 class="text-xl font-semibold">How WPM and accuracy are calculated</h2>
      <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-base-content/70">
        <li><strong>WPM</strong> = correct characters ÷ 5 ÷ minutes. A space after a fully correct word counts as one correct character.</li>
        <li><strong>Raw WPM</strong> = all typed characters ÷ 5 ÷ minutes, including incorrect and extra characters.</li>
        <li><strong>Accuracy</strong> = correct keypresses ÷ total keypresses. Corrected mistakes still count.</li>
        <li><strong>Consistency</strong> = 100 × (1 − standard deviation ÷ mean) of per-second raw speed.</li>
      </ul>

      <h2 class="mt-8 text-xl font-semibold">Fair leaderboards</h2>
      <p class="mt-2 text-sm text-base-content/70">
        Ranked submissions are replay-verified on the server with the same typing engine used in the browser.
        Bot-like timing, impossible speed, and metric mismatches are flagged for review instead of published.
      </p>

      <h2 class="mt-8 text-xl font-semibold">Privacy</h2>
      <p class="mt-2 text-sm text-base-content/70">
        Guests keep settings and the last 50 tests locally in the browser. Accounts store an email, username,
        avatar, and test results. Public profiles are opt-out from settings, and accounts can be deleted.
      </p>
    </section>
  </div>
</template>
