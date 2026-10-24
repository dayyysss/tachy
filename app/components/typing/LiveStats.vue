<script setup lang="ts">
import type { Metrics } from '#shared/types/test'

const props = defineProps<{
  metrics: Metrics
  remainingMs: number
  elapsedMs: number
  mode: string
  showWpm: boolean
  showAccuracy: boolean
  showTimer: boolean
}>()

const timer = computed(() => {
  const ms = props.mode === 'time' ? props.remainingMs : props.elapsedMs
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}`
})
</script>

<template>
  <div class="chrome flex items-center justify-center gap-8 font-mono tabular-nums">
    <span v-if="showTimer" class="text-3xl font-semibold text-primary tracking-tight">{{ timer }}</span>
    <div v-if="showWpm" class="flex items-baseline gap-1 text-base-content/80">
      <span class="text-2xl font-semibold">{{ Math.round(metrics.wpm) }}</span>
      <span class="text-xs uppercase tracking-wider text-base-content/40">wpm</span>
    </div>
    <div v-if="showAccuracy" class="flex items-baseline gap-1 text-base-content/80">
      <span class="text-2xl font-semibold">{{ Math.round(metrics.accuracy) }}</span>
      <span class="text-xs uppercase tracking-wider text-base-content/40">%</span>
    </div>
  </div>
</template>
