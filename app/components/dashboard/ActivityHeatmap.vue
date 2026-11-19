<script setup lang="ts">
import type { HistoryEntry } from '#shared/types/test'
import { localDate } from '#shared/utils/dates'

interface DayData {
  key: string
  date: string
  tests: number
  best: number
  words: number
  level: number
}

const props = defineProps<{
  history: HistoryEntry[]
  serverHistory?: HistoryEntry[]
  heatmapDays?: { date: string; tests: number; words: number; bestWpm?: number; avgWpm?: number }[]
  weeks?: number
}>()

const weeks = computed(() => props.weeks ?? 53)

const sourceHistory = computed(() => props.serverHistory?.length ? props.serverHistory : props.history)

const byDate = computed(() => {
  const map = new Map<string, { tests: number; best: number; words: number }>()

  if (props.heatmapDays?.length) {
    for (const d of props.heatmapDays) {
      map.set(d.date, {
        tests: d.tests,
        best: d.bestWpm ?? 0,
        words: d.words ?? 0,
      })
    }
    return map
  }

  for (const entry of sourceHistory.value) {
    const date = localDate(new Date(entry.createdAt))
    const current = map.get(date) ?? { tests: 0, best: 0, words: 0 }
    current.tests++
    current.best = Math.max(current.best, entry.wpm)
    current.words += (entry.wordsTyped || 0)
    map.set(date, current)
  }
  return map
})

const days = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const total = weeks.value * 7
  const start = new Date(today)
  start.setDate(start.getDate() - (total - 1))
  start.setDate(start.getDate() - start.getDay())

  return Array.from({ length: total + start.getDay() }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    if (date > today) return null
    const key = localDate(date)
    const entry = byDate.value.get(key)
    return {
      key,
      date: key,
      tests: entry?.tests ?? 0,
      best: entry?.best ?? 0,
      words: entry?.words ?? 0,
      level: entry ? Math.min(4, Math.max(1, Math.ceil(entry.tests / 2))) : 0,
    }
  }).filter(Boolean) as DayData[]
})

const streak = computed(() => {
  let current = 0
  const today = new Date()
  for (let i = 0; i < 400; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const key = localDate(date)
    if (byDate.value.has(key)) current++
    else if (i > 0) break
  }
  return current
})

const totalTests = computed(() => sourceHistory.value.length)
const activeDays = computed(() => byDate.value.size)

const hoveredDay = ref<DayData | null>(null)
</script>

<template>
  <div class="rounded-box border border-base-300 bg-base-200/40 p-4 relative">
    <div class="mb-3 flex items-center justify-between text-xs text-base-content/60">
      <span>{{ weeks }} weeks · {{ totalTests }} tests · {{ activeDays }} active days</span>
      <span>{{ streak }}-day streak</span>
    </div>
    <div
      class="grid grid-flow-col gap-[3px] overflow-x-auto pb-1"
      :style="{ gridTemplateRows: 'repeat(7, 11px)', gridAutoColumns: '11px' }"
    >
      <div
        v-for="day in days"
        :key="day.key"
        class="heat-cell"
        :data-level="day.level"
        @mouseenter="hoveredDay = day"
        @mouseleave="hoveredDay = null"
      />
    </div>

    <!-- Hover Tooltip -->
    <div
      v-if="hoveredDay"
      class="absolute z-10 px-3 py-2 rounded-lg bg-base-100 border border-base-300 shadow-lg text-[11px] font-mono whitespace-nowrap pointer-events-none"
      style="left: 50%; top: 60px; transform: translateX(-50%);"
    >
      <div class="font-semibold text-base-content">{{ hoveredDay.date }}</div>
      <div class="text-base-content/70">{{ hoveredDay.tests }} test{{ hoveredDay.tests !== 1 ? 's' : '' }} · Best {{ Math.round(hoveredDay.best) }} WPM · {{ hoveredDay.words.toLocaleString() }} words</div>
    </div>

    <div class="mt-2 flex items-center justify-end gap-1 text-[10px] text-base-content/40">
      <span>less</span>
      <span v-for="level in 5" :key="level" class="heat-cell !size-2.5" :data-level="level - 1" />
      <span>more</span>
    </div>
  </div>
</template>