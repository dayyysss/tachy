<script setup lang="ts">
import type { LeaderboardRow } from '#shared/types/test'
import { availableLanguages, codeLanguages } from '#shared/config/languages'

useSeo('leaderboard')

const period = ref<'daily' | 'weekly' | 'alltime'>('daily')
const board = ref<'wpm' | 'xp'>('wpm')
const category = ref('en:words:time:60')
const scope = ref('global')
const page = ref(1)

const categories = computed(() => {
  const list: { value: string; label: string }[] = []
  for (const language of availableLanguages) {
    const lang = language.code
    for (const amount of [15, 30, 60, 120]) {
      list.push({ value: `${lang}:words:time:${amount}`, label: `${language.label} · ${amount}s` })
    }
    for (const amount of [25, 50, 100]) {
      list.push({ value: `${lang}:words:words:${amount}`, label: `${language.label} · ${amount} words` })
    }
    for (const amount of [30, 60]) {
      list.push({ value: `${lang}:numbers:time:${amount}`, label: `${language.label} · numbers ${amount}s` })
    }
    list.push({ value: `${lang}:quotes:quote:0`, label: `${language.label} · quote` })
    for (const amount of [30, 60]) {
      list.push({ value: `${lang}:words:time:${amount}:p`, label: `${language.label} · punctuation ${amount}s` })
      list.push({ value: `${lang}:words:time:${amount}:n`, label: `${language.label} · numbers ${amount}s` })
    }
  }
  for (const code of codeLanguages) {
    list.push({ value: `${code.code}:code:code:0`, label: `Code · ${code.label}` })
  }
  return list
})

const endpoint = computed(() => (board.value === 'xp' ? '/api/leaderboard/xp' : '/api/leaderboard'))
const query = computed(() => board.value === 'xp'
  ? { period: period.value, scope: scope.value, page: page.value }
  : { period: period.value, category: category.value, page: page.value })

const { data, pending, error } = await useFetch<{
  rows: LeaderboardRow[]
  total: number
  me: LeaderboardRow | null
}>(endpoint, { query, default: () => ({ rows: [], total: 0, me: null }) })

const pages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / 50)))

watch([period, board, category, scope], () => { page.value = 1 })
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">{{ $t('leaderboard.title') }}</h1>
      <p class="text-sm text-base-content/50">Verified, replay-checked results. Daily and weekly reset at 00:00 UTC.</p>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <div class="join border border-base-300">
        <button
          v-for="item in (['daily', 'weekly', 'alltime'] as const)"
          :key="item"
          type="button"
          class="btn btn-sm join-item capitalize"
          :class="period === item ? 'btn-primary text-primary-content font-semibold' : 'btn-ghost text-base-content/70'"
          @click="period = item"
        >{{ item }}</button>
      </div>

      <div class="join border border-base-300">
        <button type="button" class="btn btn-sm join-item" :class="board === 'wpm' ? 'btn-primary text-primary-content font-semibold' : 'btn-ghost text-base-content/70'" @click="board = 'wpm'">Speed</button>
        <button type="button" class="btn btn-sm join-item" :class="board === 'xp' ? 'btn-primary text-primary-content font-semibold' : 'btn-ghost text-base-content/70'" @click="board = 'xp'">XP</button>
      </div>

      <select v-if="board === 'wpm'" v-model="category" class="select select-bordered select-sm">
        <option v-for="item in categories" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select v-else v-model="scope" class="select select-bordered select-sm">
        <option value="global">All languages</option>
        <option v-for="language in availableLanguages" :key="language.code" :value="language.code">{{ language.label }}</option>
      </select>
    </div>

    <div class="rounded-box border border-base-300">
      <table class="table table-sm">
        <thead>
          <tr>
            <th class="w-12">#</th><th>Player</th><th>Level</th>
            <th>{{ board === 'xp' ? 'XP' : 'WPM' }}</th>
            <th v-if="board === 'wpm'">Accuracy</th>
            <th v-if="board === 'wpm'">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pending"><td :colspan="board === 'xp' ? 4 : 6" class="py-8 text-center opacity-50">Loading…</td></tr>
          <tr v-else-if="error"><td :colspan="board === 'xp' ? 4 : 6" class="py-8 text-center opacity-50">Could not load leaderboard.</td></tr>
          <tr v-else-if="!data?.rows.length"><td :colspan="board === 'xp' ? 4 : 6" class="py-8 text-center opacity-50">{{ $t('leaderboard.empty') }}</td></tr>
          <tr
            v-for="row in data?.rows"
            :key="`${row.userId}-${row.rank}`"
            class="transition-colors hover:bg-base-200/50"
            :class="{ 'border-l-2 border-primary bg-primary/10 font-medium': data?.me?.userId === row.userId }"
          >
            <td class="tabular-nums font-mono font-medium">
              <span v-if="row.rank === 1" class="text-primary font-bold">#1</span>
              <span v-else-if="row.rank === 2" class="text-base-content font-bold">#2</span>
              <span v-else-if="row.rank === 3" class="text-accent font-semibold">#3</span>
              <span v-else class="opacity-50">#{{ row.rank }}</span>
            </td>
            <td>
              <NuxtLink :to="`/u/${row.username}`" class="link link-hover font-medium">{{ row.username }}</NuxtLink>
            </td>
            <td class="tabular-nums font-mono text-xs opacity-75">L{{ row.level }}</td>
            <td class="font-semibold font-mono tabular-nums text-primary">{{ board === 'xp' ? Math.round((row as unknown as { xp: number }).xp) : Math.round(row.wpm) }}</td>
            <td v-if="board === 'wpm'" class="tabular-nums font-mono text-xs opacity-75">{{ Math.round(row.accuracy) }}%</td>
            <td v-if="board === 'wpm'" class="text-xs opacity-40 font-mono">{{ row.date }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="data?.me && !data.rows.some(row => row.userId === data?.me?.userId)" class="mt-3 text-sm">
      Your rank: <strong>#{{ data.me.rank }}</strong> · {{ data.me.username }}
      · {{ board === 'xp' ? `${(data.me as unknown as { xp: number }).xp} XP` : `${Math.round(data.me.wpm)} WPM` }}
    </p>

    <div class="mt-4 flex items-center justify-end gap-2">
      <button type="button" class="btn btn-sm" :disabled="page <= 1" @click="page--">Prev</button>
      <span class="text-xs opacity-60">{{ page }} / {{ pages }}</span>
      <button type="button" class="btn btn-sm" :disabled="page >= pages" @click="page++">Next</button>
    </div>
  </div>
</template>
