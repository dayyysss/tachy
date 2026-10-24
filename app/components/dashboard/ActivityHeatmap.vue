<script setup lang="ts">
import type { HistoryEntry } from '#shared/types/test'
import { localDate, daysBetween } from '#shared/utils/dates'

const props = defineProps<{ history: HistoryEntry[]; weeks?: number }>()

const weeks = computed(() => props.weeks ?? 53)

const byDate = computed(() => {
  const map = new Map<string, { tests: number; best: number; words: number }>()
  for (const entry of props.history) {
    const date = localDate(new Date(entry.createdAt))
    const current = map.get(date) ?? { tests: 0, best: 0, words: 0 }
    current.tests++
    current.best = Math.max(current.best, entry.wpm)
    current.words += entry.wordsTyped
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
  }).filter(Boolean)
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

const totalTests = computed(() => props.history.length)
const activeDays = computed(() => byDate.value.size)
</script>

<template>
  <div class="rounded-box border border-base-300 bg-base-200/40 p-4">
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
        :title="`${day.date} · ${day.tests} tests · best ${Math.round(day.best)} wpm`"
      />
    </div>
    <div class="mt-2 flex items-center justify-end gap-1 text-[10px] text-base-content/40">
      <span>less</span>
      <span v-for="level in 5" :key="level" class="heat-cell !size-2.5" :data-level="level - 1" />
      <span>more</span>
    </div>
  </div>
</template>
