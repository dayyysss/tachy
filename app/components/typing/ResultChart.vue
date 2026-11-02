<script setup lang="ts">
import Chart from 'chart.js/auto'
import type { WpmPoint } from '#shared/types/test'

const props = defineProps<{
  series: WpmPoint[]
  durationMs: number
  consistency?: number
  accuracy?: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null
let themeObserver: MutationObserver | null = null

const visibleDatasets = ref({
  wpm: true,
  raw: true,
  errors: true,
})

// Format series data safely
const preparedSeries = computed(() => {
  if (!props.series || props.series.length === 0) {
    return [{ second: 0, wpm: 0, raw: 0, errors: 0 }, { second: 1, wpm: 0, raw: 0, errors: 0 }]
  }
  if (props.series.length === 1) {
    return [{ second: 0, wpm: 0, raw: 0, errors: 0 }, props.series[0]!]
  }
  return props.series
})

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const clean = color.replace('#', '')
    if (clean.length === 6) {
      const r = parseInt(clean.slice(0, 2), 16)
      const g = parseInt(clean.slice(2, 4), 16)
      const b = parseInt(clean.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  }
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`
}

// Summary telemetry metrics
const telemetry = computed(() => {
  const points = preparedSeries.value
  const peakWpm = Math.max(...points.map(p => p.wpm), 0)
  const peakRaw = Math.max(...points.map(p => p.raw), 0)
  const avgWpm = points.length ? Math.round(points.reduce((s, p) => s + p.wpm, 0) / points.length) : 0
  const totalErrors = points.reduce((s, p) => s + p.errors, 0)
  return { peakWpm, peakRaw, avgWpm, totalErrors }
})

function getThemeColors() {
  if (!import.meta.client) {
    return {
      primary: '#f4c95d',
      secondary: '#60a5fa',
      error: '#f07878',
      text: '#e7e9ec',
      textMuted: 'rgba(231, 233, 236, 0.4)',
      grid: 'rgba(255, 255, 255, 0.05)',
      cardBg: 'rgba(23, 25, 28, 0.95)',
    }
  }

  const root = getComputedStyle(document.documentElement)
  const primary = root.getPropertyValue('--color-primary').trim() || '#f4c95d'
  const secondary = root.getPropertyValue('--color-secondary').trim() || '#60a5fa'
  const error = root.getPropertyValue('--color-error').trim() || '#f07878'
  const text = root.getPropertyValue('--color-base-content').trim() || '#e7e9ec'

  return {
    primary,
    secondary,
    error,
    text,
    textMuted: 'rgba(231, 233, 236, 0.4)',
    grid: 'rgba(255, 255, 255, 0.06)',
    cardBg: 'rgba(23, 25, 28, 0.95)',
  }
}

function initChart() {
  if (!canvasRef.value) return
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const colors = getThemeColors()
  const points = preparedSeries.value
  const labels = points.map(p => `${p.second}`)
  const wpmData = points.map(p => p.wpm)
  const rawData = points.map(p => p.raw)
  const errorData = points.map(p => p.errors > 0 ? p.errors : null)
  const hasErrors = points.some(p => p.errors > 0)

  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'wpm',
          data: wpmData,
          borderColor: colors.primary,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart
            const { ctx, chartArea } = chart
            if (!chartArea) return 'transparent'
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, withAlpha(colors.primary, 0.22))
            gradient.addColorStop(1, 'transparent')
            return gradient
          },
          pointRadius: points.length <= 4 ? 3 : 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: colors.primary,
          pointHoverBorderColor: colors.cardBg,
          pointHoverBorderWidth: 2,
          yAxisID: 'y',
          hidden: !visibleDatasets.value.wpm,
        },
        {
          label: 'raw',
          data: rawData,
          borderColor: colors.secondary,
          borderWidth: 1.5,
          borderDash: [4, 4],
          tension: 0.35,
          fill: false,
          pointRadius: points.length <= 4 ? 3 : 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: colors.secondary,
          pointHoverBorderColor: colors.cardBg,
          pointHoverBorderWidth: 1.5,
          yAxisID: 'y',
          hidden: !visibleDatasets.value.raw,
        },
        {
          label: 'errors',
          data: errorData,
          borderColor: colors.error,
          backgroundColor: colors.error,
          showLine: false,
          pointStyle: 'crossRot',
          pointRadius: (ctx) => {
            const val = ctx.raw as number | null
            return val && val > 0 ? 5 : 0
          },
          pointHoverRadius: 7,
          pointBorderWidth: 2,
          yAxisID: 'y1',
          hidden: !visibleDatasets.value.errors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400,
        easing: 'easeOutQuart',
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: colors.cardBg,
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { family: 'JetBrains Mono, monospace', size: 11, weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono, monospace', size: 11 },
          displayColors: true,
          callbacks: {
            title: (items) => `Time: ${items[0]?.label}s`,
            label: (item) => {
              if (item.dataset.label === 'wpm') {
                return ` WPM: ${Math.round(Number(item.raw))}`
              }
              if (item.dataset.label === 'raw') {
                return ` Raw: ${Math.round(Number(item.raw))}`
              }
              if (item.dataset.label === 'errors' && item.raw !== null) {
                return ` Errors: ${item.raw}`
              }
              return ''
            },
            filter: (item) => {
              // Hide empty error rows in tooltip
              if (item.dataset.label === 'errors' && (item.raw === null || item.raw === 0)) {
                return false
              }
              return true
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: false,
            text: 'seconds',
          },
          grid: {
            color: colors.grid,
          },
          ticks: {
            color: colors.textMuted,
            font: { family: 'JetBrains Mono, monospace', size: 10 },
            maxTicksLimit: 12,
          },
        },
        y: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'wpm',
            color: colors.textMuted,
            font: { family: 'JetBrains Mono, monospace', size: 10 },
          },
          min: 0,
          suggestedMax: Math.max(telemetry.value.peakRaw + 10, 40),
          grid: {
            color: colors.grid,
          },
          ticks: {
            color: colors.textMuted,
            font: { family: 'JetBrains Mono, monospace', size: 10 },
            precision: 0,
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          display: hasErrors && visibleDatasets.value.errors,
          title: {
            display: true,
            text: 'errors',
            color: colors.error,
            font: { family: 'JetBrains Mono, monospace', size: 10 },
          },
          min: 0,
          suggestedMax: Math.max(telemetry.value.totalErrors > 0 ? 3 : 1, 2),
          grid: {
            display: false,
          },
          ticks: {
            color: colors.error,
            font: { family: 'JetBrains Mono, monospace', size: 10 },
            stepSize: 1,
            precision: 0,
          },
        },
      },
    },
  })
}

function toggleDataset(key: 'wpm' | 'raw' | 'errors') {
  visibleDatasets.value[key] = !visibleDatasets.value[key]
  if (!chartInstance) return

  const datasetIndex = key === 'wpm' ? 0 : key === 'raw' ? 1 : 2
  const dataset = chartInstance.data.datasets[datasetIndex]
  if (dataset) {
    dataset.hidden = !visibleDatasets.value[key]
  }

  // Update right Y-axis visibility
  if (key === 'errors' && chartInstance.options.scales?.y1) {
    const hasErrors = preparedSeries.value.some(p => p.errors > 0)
    chartInstance.options.scales.y1.display = hasErrors && visibleDatasets.value.errors
  }

  chartInstance.update('none')
}

watch(() => props.series, () => {
  initChart()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
  })

  // Theme mutation observer
  if (typeof MutationObserver !== 'undefined') {
    themeObserver = new MutationObserver(() => {
      initChart()
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-type'],
    })
  }
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = null
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<template>
  <div class="w-full flex flex-col gap-3 font-mono">
    <!-- Telemetry & Dataset Control Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
      <!-- Interactive Dataset Toggles -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 cursor-pointer select-none"
          :class="visibleDatasets.wpm
            ? 'border-primary/50 bg-primary/10 text-primary shadow-xs'
            : 'border-base-300 bg-base-200/40 text-base-content/40 hover:text-base-content/70'"
          title="Toggle WPM net line"
          @click="toggleDataset('wpm')"
        >
          <span class="size-2 rounded-full bg-primary" :class="visibleDatasets.wpm ? 'opacity-100' : 'opacity-40'" />
          <span>wpm</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 cursor-pointer select-none"
          :class="visibleDatasets.raw
            ? 'border-secondary/50 bg-secondary/10 text-secondary shadow-xs'
            : 'border-base-300 bg-base-200/40 text-base-content/40 hover:text-base-content/70'"
          title="Toggle Raw speed line"
          @click="toggleDataset('raw')"
        >
          <span class="size-2 rounded-full border border-secondary" :class="visibleDatasets.raw ? 'opacity-100' : 'opacity-40'" />
          <span>raw</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all duration-150 cursor-pointer select-none"
          :class="visibleDatasets.errors
            ? 'border-error/50 bg-error/10 text-error shadow-xs'
            : 'border-base-300 bg-base-200/40 text-base-content/40 hover:text-base-content/70'"
          title="Toggle Error points"
          @click="toggleDataset('errors')"
        >
          <span class="text-error font-bold leading-none">✕</span>
          <span>errors</span>
          <span v-if="telemetry.totalErrors > 0" class="text-[10px] opacity-75 font-bold">({{ telemetry.totalErrors }})</span>
        </button>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="flex items-center gap-3 text-[11px] text-base-content/50">
        <span title="Peak Net WPM">
          peak <strong class="text-primary font-bold">{{ Math.round(telemetry.peakWpm) }}</strong>
        </span>
        <span class="opacity-30">·</span>
        <span title="Peak Raw WPM">
          raw peak <strong class="text-secondary font-bold">{{ Math.round(telemetry.peakRaw) }}</strong>
        </span>
        <span class="opacity-30">·</span>
        <span title="Average Net WPM">
          avg <strong class="text-base-content/80 font-bold">{{ telemetry.avgWpm }}</strong>
        </span>
      </div>
    </div>

    <!-- Chart Canvas Area -->
    <div class="relative w-full h-44 sm:h-52">
      <canvas ref="canvasRef" class="w-full h-full block" />
    </div>
  </div>
</template>
