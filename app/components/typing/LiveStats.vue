<script setup lang="ts">
import type { Metrics } from '#shared/types/test'

const props = withDefaults(defineProps<{
  metrics: Metrics
  remainingMs: number
  elapsedMs: number
  mode: string
  textWidth?: 'narrow' | 'medium' | 'wide'
  showWpm?: boolean
  showAccuracy?: boolean
  showTimer?: boolean
  isRunning?: boolean
}>(), {
  showWpm: false,
  showAccuracy: false,
  showTimer: true,
  isRunning: false,
})

const widthClass = computed(() => ({
  'max-w-4xl': props.textWidth === 'narrow',
  'max-w-6xl': props.textWidth === 'medium' || !props.textWidth,
  'max-w-7xl': props.textWidth === 'wide',
}))

const timer = computed(() => {
  const ms = props.mode === 'time' ? props.remainingMs : props.elapsedMs
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}`
})
</script>

<template>
  <div
    class="mx-auto w-full select-none px-4 sm:px-8 md:px-12 transition-all"
    :class="widthClass"
  >
    <div class="flex items-center justify-between font-mono tabular-nums py-0.5">
      <!-- Top-left timer: compact, clear, non-distracting -->
      <div v-if="showTimer" class="group relative inline-flex items-baseline gap-1.5 cursor-default">
        <span
          class="font-mono text-xl sm:text-2xl font-bold tracking-tight text-primary transition-all duration-150"
          :class="isRunning ? 'opacity-100 scale-100' : 'opacity-70'"
        >
          {{ timer }}
        </span>

        <!-- Hover detail tooltip -->
        <div class="pointer-events-none absolute -bottom-10 left-0 whitespace-nowrap rounded-lg border border-base-300 bg-base-200/95 px-2.5 py-1 text-[10px] font-mono text-base-content/80 opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 z-40">
          <span v-if="mode === 'time'">Remaining: {{ (remainingMs / 1000).toFixed(1) }}s</span>
          <span v-else>Elapsed: {{ (elapsedMs / 1000).toFixed(1) }}s</span>
        </div>
      </div>

      <!-- Right side: Optional live speed/accuracy indicators (when enabled by user in settings) -->
      <div v-if="showWpm || showAccuracy" class="flex items-center gap-3 text-xs sm:text-sm font-mono text-base-content/60">
        <span v-if="showWpm" class="flex items-center gap-1">
          <span class="text-base-content font-bold tabular-nums">{{ Math.round(metrics.wpm) }}</span>
          <span class="text-[10px] text-base-content/40 uppercase">wpm</span>
        </span>
        <span v-if="showAccuracy" class="flex items-center gap-1">
          <span class="text-base-content font-bold tabular-nums">{{ Math.round(metrics.accuracy) }}%</span>
          <span class="text-[10px] text-base-content/40 uppercase">acc</span>
        </span>
      </div>
    </div>
  </div>
</template>
