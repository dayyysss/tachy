<script setup lang="ts">
const props = withDefaults(defineProps<{
  values: number[]
  height?: number
  label?: string
}>(), {
  height: 120,
  label: 'Trend',
})

const uid = useId()
const points = computed(() => {
  const values = props.values.length ? props.values : [0]
  const max = Math.max(...values, 1)
  return values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 100
    const y = 100 - (value / max) * 90
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
})
</script>

<template>
  <svg
    :viewBox="`0 0 100 100`"
    preserveAspectRatio="none"
    class="w-full"
    :style="{ height: `${height}px` }"
    role="img"
    :aria-label="label"
  >
    <defs>
      <linearGradient :id="`trend-grad-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.25" />
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
      </linearGradient>
    </defs>
    <polygon
      :points="`0,100 ${points} 100,100`"
      :fill="`url(#trend-grad-${uid})`"
    />
    <polyline
      :points="points"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
      class="text-primary"
    />
  </svg>
</template>
