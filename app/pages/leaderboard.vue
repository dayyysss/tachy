<script setup lang="ts">
import type { LeaderboardRow } from '#shared/types/test'
import { availableLanguages, codeLanguages } from '#shared/config/languages'
import {
  Trophy,
  Zap,
  Sparkles,
  Globe,
  Filter,
  ArrowRight,
  Clock,
  FileText,
  Quote,
  Code2,
  Hash,
  Crown,
  Medal,
  ChevronDown,
  Check,
} from 'lucide-vue-next'

useSeo('leaderboard')

const period = ref<'daily' | 'weekly' | 'alltime'>('alltime')
const board = ref<'wpm' | 'xp'>('wpm')
const category = ref('overall')
const language = ref('all')
const scope = ref('global')
const page = ref(1)

const categories = [
  { group: 'Utama', items: [{ value: 'overall', label: 'Overall (Semua Kategori)' }] },
  {
    group: 'Mode Waktu (Time)',
    items: [
      { value: 'time:60', label: 'Time 60s (Standard Benchmark)' },
      { value: 'time:30', label: 'Time 30s (Sprint)' },
      { value: 'time:15', label: 'Time 15s (Burst)' },
      { value: 'time:120', label: 'Time 120s (Endurance)' },
    ],
  },
  {
    group: 'Mode Kata (Words)',
    items: [
      { value: 'words:25', label: 'Words 25' },
      { value: 'words:50', label: 'Words 50' },
      { value: 'words:100', label: 'Words 100' },
    ],
  },
  {
    group: 'Mode Khusus (Specialty)',
    items: [
      { value: 'quote', label: 'Quotes / Kutipan' },
      { value: 'code', label: 'Code / Syntax' },
      { value: 'numbers:60', label: 'Numbers 60s' },
      { value: 'numbers:30', label: 'Numbers 30s' },
    ],
  },
]

const activeCategoryIcon = computed(() => {
  if (category.value === 'overall') return Trophy
  if (category.value.startsWith('time')) return Clock
  if (category.value.startsWith('words')) return FileText
  if (category.value === 'quote') return Quote
  if (category.value === 'code') return Code2
  if (category.value.startsWith('numbers')) return Hash
  return Filter
})

const currentCategoryLabel = computed(() => {
  for (const grp of categories) {
    const found = grp.items.find(i => i.value === category.value)
    if (found) return found.label
  }
  return category.value
})

const currentLanguageLabel = computed(() => {
  if (category.value === 'code') {
    if (language.value === 'all') return 'All Code Languages'
    return codeLanguages.find(c => c.code === language.value)?.label ?? language.value
  }
  if (language.value === 'all') return 'Semua Bahasa'
  return availableLanguages.find(l => l.code === language.value)?.label ?? language.value
})

const currentScopeLabel = computed(() => {
  if (scope.value === 'global') return 'Semua Bahasa'
  return availableLanguages.find(l => l.code === scope.value)?.label ?? scope.value
})

function selectCategory(val: string) {
  category.value = val
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

function selectLanguage(val: string) {
  language.value = val
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

function selectScope(val: string) {
  scope.value = val
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

const endpoint = computed(() => (board.value === 'xp' ? '/api/leaderboard/xp' : '/api/leaderboard'))
const query = computed(() => board.value === 'xp'
  ? { period: period.value, scope: scope.value, page: page.value }
  : { period: period.value, category: category.value, language: language.value, page: page.value })

const { data, pending, error } = await useFetch<{
  rows: LeaderboardRow[]
  total: number
  me: LeaderboardRow | null
}>(endpoint, { query, default: () => ({ rows: [], total: 0, me: null }) })

const pages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / 50)))

watch([period, board, category, language, scope], () => { page.value = 1 })
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 space-y-6 font-sans">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-300 pb-5">
      <div>
        <div class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary mb-2">
          <Trophy class="size-3.5" />
          <span>Fair & Anti-Cheat Verified</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
          {{ $t('leaderboard.title') }}
        </h1>
        <p class="text-xs sm:text-sm text-base-content/60 font-mono mt-1">
          Peringkat juru ketik tercepat berdasarkan verifikasi anti-cheat dan personal best.
        </p>
      </div>

      <!-- Quick Board Switcher (Speed vs XP) -->
      <div class="join border border-base-300 self-start sm:self-center shadow-xs">
        <button
          type="button"
          class="btn btn-sm join-item gap-1.5"
          :class="board === 'wpm' ? 'btn-primary text-primary-content font-bold' : 'btn-ghost text-base-content/70'"
          @click="board = 'wpm'"
        >
          <Zap class="size-3.5" />
          <span>Speed (WPM)</span>
        </button>
        <button
          type="button"
          class="btn btn-sm join-item gap-1.5"
          :class="board === 'xp' ? 'btn-primary text-primary-content font-bold' : 'btn-ghost text-base-content/70'"
          @click="board = 'xp'"
        >
          <Sparkles class="size-3.5" />
          <span>Experience (XP)</span>
        </button>
      </div>
    </div>

    <!-- Category Mode Pill Navigation (Speed Mode Only) -->
    <div v-if="board === 'wpm'" class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        class="btn btn-xs sm:btn-sm gap-1.5 font-mono text-xs rounded-xl shadow-2xs transition-all"
        :class="category === 'overall' ? 'btn-primary text-primary-content font-bold' : 'btn-ghost border border-base-300 text-base-content/70 hover:border-primary/50'"
        @click="category = 'overall'"
      >
        <Trophy class="size-3.5" />
        <span>Overall</span>
      </button>

      <button
        type="button"
        class="btn btn-xs sm:btn-sm gap-1.5 font-mono text-xs rounded-xl shadow-2xs transition-all"
        :class="category.startsWith('time') ? 'btn-primary text-primary-content font-bold' : 'btn-ghost border border-base-300 text-base-content/70 hover:border-primary/50'"
        @click="category = category.startsWith('time') ? category : 'time:60'"
      >
        <Clock class="size-3.5" />
        <span>Time</span>
      </button>

      <button
        type="button"
        class="btn btn-xs sm:btn-sm gap-1.5 font-mono text-xs rounded-xl shadow-2xs transition-all"
        :class="category.startsWith('words') ? 'btn-primary text-primary-content font-bold' : 'btn-ghost border border-base-300 text-base-content/70 hover:border-primary/50'"
        @click="category = category.startsWith('words') ? category : 'words:50'"
      >
        <FileText class="size-3.5" />
        <span>Words</span>
      </button>

      <button
        type="button"
        class="btn btn-xs sm:btn-sm gap-1.5 font-mono text-xs rounded-xl shadow-2xs transition-all"
        :class="category === 'quote' ? 'btn-primary text-primary-content font-bold' : 'btn-ghost border border-base-300 text-base-content/70 hover:border-primary/50'"
        @click="category = 'quote'"
      >
        <Quote class="size-3.5" />
        <span>Quotes</span>
      </button>

      <button
        type="button"
        class="btn btn-xs sm:btn-sm gap-1.5 font-mono text-xs rounded-xl shadow-2xs transition-all"
        :class="category === 'code' ? 'btn-primary text-primary-content font-bold' : 'btn-ghost border border-base-300 text-base-content/70 hover:border-primary/50'"
        @click="category = 'code'"
      >
        <Code2 class="size-3.5" />
        <span>Code</span>
      </button>

      <button
        type="button"
        class="btn btn-xs sm:btn-sm gap-1.5 font-mono text-xs rounded-xl shadow-2xs transition-all"
        :class="category.startsWith('numbers') ? 'btn-primary text-primary-content font-bold' : 'btn-ghost border border-base-300 text-base-content/70 hover:border-primary/50'"
        @click="category = category.startsWith('numbers') ? category : 'numbers:60'"
      >
        <Hash class="size-3.5" />
        <span>Numbers</span>
      </button>
    </div>

    <!-- Filter Control Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-base-200/40 border border-base-300 rounded-2xl p-3 sm:p-4">
      <!-- Period Selector -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-base-content/50 uppercase tracking-wider hidden sm:inline">Periode:</span>
        <div class="join border border-base-300 bg-base-100/60 shadow-xs">
          <button
            v-for="item in (['alltime', 'weekly', 'daily'] as const)"
            :key="item"
            type="button"
            class="btn btn-xs sm:btn-sm join-item capitalize font-mono text-xs"
            :class="period === item ? 'btn-primary text-primary-content font-bold' : 'btn-ghost text-base-content/70'"
            @click="period = item"
          >
            {{ item === 'alltime' ? 'All-Time' : item === 'weekly' ? 'Weekly' : 'Daily' }}
          </button>
        </div>
      </div>

      <!-- Category & Language Filters (Speed Mode) -->
      <div v-if="board === 'wpm'" class="flex flex-wrap items-center gap-2">
        <!-- Preset / Category Selector with Dynamic Lucide Icon -->
        <div class="dropdown dropdown-bottom dropdown-end">
          <button
            tabindex="0"
            type="button"
            class="flex items-center gap-2 bg-base-100 hover:bg-base-300/40 border border-base-300 rounded-xl px-2.5 py-1.5 shadow-xs font-mono text-xs transition-colors cursor-pointer text-base-content"
          >
            <component :is="activeCategoryIcon" class="size-3.5 text-primary shrink-0" />
            <span class="truncate max-w-44 sm:max-w-xs font-medium">{{ currentCategoryLabel }}</span>
            <ChevronDown class="size-3 text-base-content/40 shrink-0" />
          </button>
          <ul
            tabindex="0"
            class="dropdown-content menu menu-sm z-50 mt-1.5 w-72 max-h-80 flex-col flex-nowrap overflow-y-auto overflow-x-hidden rounded-2xl border border-base-300 bg-base-200 p-2 shadow-2xl font-mono text-xs backdrop-blur-md"
          >
            <template v-for="grp in categories" :key="grp.group">
              <li class="menu-title px-2 py-1 font-bold text-primary/80 uppercase tracking-wider text-[10px]">
                {{ grp.group }}
              </li>
              <li v-for="item in grp.items" :key="item.value">
                <button
                  type="button"
                  class="flex items-center justify-between w-full rounded-lg py-1.5 px-2.5 text-xs transition-colors"
                  :class="category === item.value ? 'active bg-primary text-primary-content font-bold shadow-xs' : 'text-base-content/80 hover:bg-base-300/70 hover:text-base-content'"
                  @click="selectCategory(item.value)"
                >
                  <span class="truncate">{{ item.label }}</span>
                  <Check v-if="category === item.value" class="size-3.5 shrink-0 ml-1.5" />
                </button>
              </li>
            </template>
          </ul>
        </div>

        <!-- Language Selector with Lucide Globe Icon -->
        <div class="dropdown dropdown-bottom dropdown-end">
          <button
            tabindex="0"
            type="button"
            class="flex items-center gap-2 bg-base-100 hover:bg-base-300/40 border border-base-300 rounded-xl px-2.5 py-1.5 shadow-xs font-mono text-xs transition-colors cursor-pointer text-base-content"
          >
            <Globe class="size-3.5 text-base-content/60 shrink-0" />
            <span class="truncate max-w-36 font-medium">{{ currentLanguageLabel }}</span>
            <ChevronDown class="size-3 text-base-content/40 shrink-0" />
          </button>
          <ul
            tabindex="0"
            class="dropdown-content menu menu-sm z-50 mt-1.5 w-60 max-h-72 flex-col flex-nowrap overflow-y-auto overflow-x-hidden rounded-2xl border border-base-300 bg-base-200 p-2 shadow-2xl font-mono text-xs backdrop-blur-md"
          >
            <template v-if="category === 'code'">
              <li>
                <button
                  type="button"
                  class="flex items-center justify-between w-full rounded-lg py-1.5 px-2.5 text-xs transition-colors"
                  :class="language === 'all' ? 'active bg-primary text-primary-content font-bold shadow-xs' : 'text-base-content/80 hover:bg-base-300/70 hover:text-base-content'"
                  @click="selectLanguage('all')"
                >
                  <span class="truncate">All Code Languages</span>
                  <Check v-if="language === 'all'" class="size-3.5 shrink-0 ml-1.5" />
                </button>
              </li>
              <li v-for="c in codeLanguages" :key="c.code">
                <button
                  type="button"
                  class="flex items-center justify-between w-full rounded-lg py-1.5 px-2.5 text-xs transition-colors"
                  :class="language === c.code ? 'active bg-primary text-primary-content font-bold shadow-xs' : 'text-base-content/80 hover:bg-base-300/70 hover:text-base-content'"
                  @click="selectLanguage(c.code)"
                >
                  <span class="truncate">{{ c.label }}</span>
                  <Check v-if="language === c.code" class="size-3.5 shrink-0 ml-1.5" />
                </button>
              </li>
            </template>
            <template v-else>
              <li>
                <button
                  type="button"
                  class="flex items-center justify-between w-full rounded-lg py-1.5 px-2.5 text-xs transition-colors"
                  :class="language === 'all' ? 'active bg-primary text-primary-content font-bold shadow-xs' : 'text-base-content/80 hover:bg-base-300/70 hover:text-base-content'"
                  @click="selectLanguage('all')"
                >
                  <span class="truncate">Semua Bahasa</span>
                  <Check v-if="language === 'all'" class="size-3.5 shrink-0 ml-1.5" />
                </button>
              </li>
              <li v-for="lang in availableLanguages" :key="lang.code">
                <button
                  type="button"
                  class="flex items-center justify-between w-full rounded-lg py-1.5 px-2.5 text-xs transition-colors"
                  :class="language === lang.code ? 'active bg-primary text-primary-content font-bold shadow-xs' : 'text-base-content/80 hover:bg-base-300/70 hover:text-base-content'"
                  @click="selectLanguage(lang.code)"
                >
                  <span class="truncate">{{ lang.label }}</span>
                  <Check v-if="language === lang.code" class="size-3.5 shrink-0 ml-1.5" />
                </button>
              </li>
            </template>
          </ul>
        </div>
      </div>

      <!-- Scope Filter (XP Mode) -->
      <div v-else class="flex items-center gap-2">
        <div class="dropdown dropdown-bottom dropdown-end">
          <button
            tabindex="0"
            type="button"
            class="flex items-center gap-2 bg-base-100 hover:bg-base-300/40 border border-base-300 rounded-xl px-2.5 py-1.5 shadow-xs font-mono text-xs transition-colors cursor-pointer text-base-content"
          >
            <Globe class="size-3.5 text-base-content/60 shrink-0" />
            <span class="truncate max-w-36 font-medium">{{ currentScopeLabel }}</span>
            <ChevronDown class="size-3 text-base-content/40 shrink-0" />
          </button>
          <ul
            tabindex="0"
            class="dropdown-content menu menu-sm z-50 mt-1.5 w-60 max-h-72 flex-col flex-nowrap overflow-y-auto overflow-x-hidden rounded-2xl border border-base-300 bg-base-200 p-2 shadow-2xl font-mono text-xs backdrop-blur-md"
          >
            <li>
              <button
                type="button"
                class="flex items-center justify-between w-full rounded-lg py-1.5 px-2.5 text-xs transition-colors"
                :class="scope === 'global' ? 'active bg-primary text-primary-content font-bold shadow-xs' : 'text-base-content/80 hover:bg-base-300/70 hover:text-base-content'"
                @click="selectScope('global')"
              >
                <span class="truncate">Semua Bahasa</span>
                <Check v-if="scope === 'global'" class="size-3.5 shrink-0 ml-1.5" />
              </button>
            </li>
            <li v-for="lang in availableLanguages" :key="lang.code">
              <button
                type="button"
                class="flex items-center justify-between w-full rounded-lg py-1.5 px-2.5 text-xs transition-colors"
                :class="scope === lang.code ? 'active bg-primary text-primary-content font-bold shadow-xs' : 'text-base-content/80 hover:bg-base-300/70 hover:text-base-content'"
                @click="selectScope(lang.code)"
              >
                <span class="truncate">{{ lang.label }}</span>
                <Check v-if="scope === lang.code" class="size-3.5 shrink-0 ml-1.5" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Leaderboard Table Container -->
    <Motion
      as="div"
      :key="`${board}-${period}-${category}-${language}-${scope}-${page}`"
      class="rounded-3xl border border-base-300 bg-base-200/20 overflow-hidden shadow-xs backdrop-blur-xs"
      :initial="{ opacity: 0.6, y: 4 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.15 }"
    >
      <div class="overflow-x-auto">
        <table class="table table-sm sm:table-md w-full">
          <thead>
            <tr class="text-base-content/50 border-b border-base-300/80 font-mono text-xs uppercase tracking-wider">
              <th class="w-16 text-center">Rank</th>
              <th>Typist</th>
              <th class="text-center w-20">Level</th>
              <th>{{ board === 'xp' ? 'XP Score' : 'Peak WPM' }}</th>
              <th v-if="board === 'wpm'" class="text-center">Accuracy</th>
              <th v-if="board === 'wpm'" class="text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading State -->
            <tr v-if="pending">
              <td :colspan="board === 'xp' ? 4 : 6" class="py-16 text-center">
                <span class="loading loading-spinner text-primary" />
                <p class="text-xs font-mono text-base-content/50 mt-2">Memuat data peringkat…</p>
              </td>
            </tr>

            <!-- Error State -->
            <tr v-else-if="error">
              <td :colspan="board === 'xp' ? 4 : 6" class="py-12 text-center text-error font-mono text-xs">
                Tidak dapat memuat leaderboard. Silakan coba beberapa saat lagi.
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="!data?.rows.length">
              <td :colspan="board === 'xp' ? 4 : 6" class="py-16 text-center">
                <div class="max-w-md mx-auto space-y-3">
                  <div class="size-12 rounded-2xl bg-base-300/60 text-base-content/40 flex items-center justify-center mx-auto">
                    <Trophy class="size-6" />
                  </div>
                  <h3 class="text-base font-bold text-base-content">Belum ada skor tercatat</h3>
                  <p class="text-xs text-base-content/60 font-mono">
                    Jadilah yang pertama masuk leaderboard untuk kategori ini!
                  </p>
                  <NuxtLink to="/" class="btn btn-primary btn-sm font-mono text-xs gap-1.5 shadow-xs inline-flex">
                    <span>Mulai Tes Sekarang</span>
                    <ArrowRight class="size-3.5" />
                  </NuxtLink>
                </div>
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-for="row in data?.rows"
              :key="`${row.userId}-${row.rank}`"
              class="border-b border-base-300/40 hover:bg-base-200/50 transition-colors"
              :class="{ 'border-l-4 border-l-primary bg-primary/10 font-medium': data?.me?.userId === row.userId }"
            >
              <!-- Rank with Lucide Crown / Medal Icons -->
              <td class="text-center font-mono">
                <span v-if="row.rank === 1" class="badge badge-warning font-bold text-xs text-warning-content shadow-xs gap-1">
                  <Crown class="size-3 fill-current" />
                  <span>#1</span>
                </span>
                <span v-else-if="row.rank === 2" class="badge badge-neutral font-bold text-xs shadow-xs gap-1 border border-base-300">
                  <Medal class="size-3 text-slate-300" />
                  <span>#2</span>
                </span>
                <span v-else-if="row.rank === 3" class="badge badge-ghost font-bold text-xs border border-primary/40 text-primary shadow-xs gap-1">
                  <Medal class="size-3 text-amber-600" />
                  <span>#3</span>
                </span>
                <span v-else class="text-xs font-semibold opacity-60">#{{ row.rank }}</span>
              </td>

              <!-- Typist Info -->
              <td>
                <NuxtLink :to="`/u/${row.username}`" class="flex items-center gap-3 group">
                  <div class="size-8 sm:size-9 rounded-xl bg-gradient-to-br from-primary/20 to-base-300 border border-base-300 flex items-center justify-center text-primary font-mono font-bold text-xs overflow-hidden shrink-0">
                    <img v-if="row.avatar" :src="row.avatar" :alt="row.username" class="h-full w-full object-cover">
                    <span v-else>{{ row.username[0]?.toUpperCase() }}</span>
                  </div>
                  <div>
                    <span class="font-bold text-sm text-base-content group-hover:text-primary transition-colors">
                      {{ row.username }}
                    </span>
                    <span v-if="data?.me?.userId === row.userId" class="badge badge-xs badge-primary ml-1.5 font-mono text-[9px]">
                      YOU
                    </span>
                  </div>
                </NuxtLink>
              </td>

              <!-- Level -->
              <td class="text-center font-mono text-xs opacity-75">
                <span class="badge badge-xs font-mono border border-base-300">L{{ row.level }}</span>
              </td>

              <!-- Speed / XP -->
              <td>
                <span class="font-mono text-base sm:text-lg font-bold text-primary tabular-nums">
                  {{ board === 'xp' ? Math.round((row as any).xp).toLocaleString() : Math.round(row.wpm) }}
                </span>
                <span class="text-xs font-mono text-base-content/50 ml-1">
                  {{ board === 'xp' ? 'XP' : 'WPM' }}
                </span>
              </td>

              <!-- Accuracy -->
              <td v-if="board === 'wpm'" class="text-center font-mono text-xs tabular-nums opacity-80">
                {{ Math.round(row.accuracy) }}%
              </td>

              <!-- Date -->
              <td v-if="board === 'wpm'" class="text-right font-mono text-xs opacity-50 tabular-nums">
                {{ row.date ? new Date(row.date).toLocaleDateString() : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Motion>

    <!-- Current User Placement Notice (When not in current page rows) -->
    <div
      v-if="data?.me && !data.rows.some(row => row.userId === data?.me?.userId)"
      class="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex items-center justify-between font-mono text-xs"
    >
      <div class="flex items-center gap-2">
        <span class="badge badge-primary font-bold">Peringkat Anda</span>
        <span class="font-bold text-base-content">#{{ data.me.rank }}</span>
        <span class="opacity-60">· {{ data.me.username }}</span>
      </div>
      <div class="font-bold text-primary">
        {{ board === 'xp' ? `${(data.me as any).xp} XP` : `${Math.round(data.me.wpm)} WPM (${Math.round(data.me.accuracy)}%)` }}
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pages > 1" class="flex items-center justify-between border-t border-base-300 pt-4 font-mono text-xs">
      <span class="text-base-content/50">
        Menampilkan halaman {{ page }} dari {{ pages }} ({{ data?.total || 0 }} typists)
      </span>
      <div class="join border border-base-300 shadow-xs">
        <button
          type="button"
          class="btn btn-xs sm:btn-sm join-item font-mono"
          :disabled="page <= 1"
          @click="page--"
        >
          Prev
        </button>
        <span class="btn btn-xs sm:btn-sm join-item pointer-events-none font-mono">
          {{ page }} / {{ pages }}
        </span>
        <button
          type="button"
          class="btn btn-xs sm:btn-sm join-item font-mono"
          :disabled="page >= pages"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
