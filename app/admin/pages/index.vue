<script setup lang="ts">
import {
  Activity,
  BarChart3,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  Type,
} from 'lucide-vue-next'

definePageMeta({ middleware: 'admin' })

const config = useRuntimeConfig()
const panelBase = computed(() => config.public.adminPanelBase || '/tachos')

const { data, error, refresh, pending } = await useFetch('/api/admin/overview')

const metrics = computed(() => [
  {
    label: 'Registered Users',
    value: data.value?.users ?? 0,
    hint: 'Total registered user accounts',
    icon: Users,
    badge: 'Database',
  },
  {
    label: 'Tests Today',
    value: data.value?.testsToday ?? 0,
    hint: 'UTC day active sessions',
    icon: Activity,
    badge: 'Live',
    highlight: true,
  },
  {
    label: 'Tests All-Time',
    value: data.value?.testsTotal ?? 0,
    hint: 'Total completed typing tests',
    icon: CheckCircle2,
  },
  {
    label: 'Flagged For Review',
    value: data.value?.flagged ?? 0,
    hint: 'Suspicious anti-cheat verdicts',
    icon: AlertTriangle,
    alert: (data.value?.flagged ?? 0) > 0,
  },
  {
    label: 'Words Typed',
    value: data.value?.words ?? 0,
    hint: 'Aggregate words verified',
    icon: Type,
  },
  {
    label: 'Time Typed',
    value: `${Math.round((data.value?.timeMs ?? 0) / 3600000)}h`,
    hint: 'Cumulative typing time',
    icon: Clock,
  },
])

// Activity Chart Telemetry
const activitySeries = computed(() => data.value?.activitySeries ?? [])
const hoveredIndex = ref<number | null>(null)

const activeItem = computed(() => {
  const series = activitySeries.value
  if (!series.length) return null
  if (hoveredIndex.value !== null && series[hoveredIndex.value]) {
    return series[hoveredIndex.value]
  }
  return series[series.length - 1] ?? null
})

const total14DayTests = computed(() => {
  return activitySeries.value.reduce((acc, cur) => acc + (cur.tests || 0), 0)
})

const maxDayTests = computed(() => {
  const values = activitySeries.value.map(d => d.tests || 0)
  return Math.max(...values, 5)
})

const maxDayWpm = computed(() => {
  const values = activitySeries.value.map(d => d.avgWpm || 0)
  return Math.max(...values, 60)
})

const avg14DayWpm = computed(() => {
  const nonZero = activitySeries.value.filter(d => (d.avgWpm || 0) > 0)
  if (!nonZero.length) return 0
  return Math.round(nonZero.reduce((acc, cur) => acc + cur.avgWpm, 0) / nonZero.length)
})

// Chart coordinates (viewBox 0 0 640 160)
const chartWidth = 640
const chartHeight = 160
const padX = 40
const padYTop = 15
const padYBottom = 30
const plotW = chartWidth - padX * 2
const plotH = chartHeight - padYTop - padYBottom

const chartPoints = computed(() => {
  const series = activitySeries.value
  if (!series.length) return []
  const stepX = plotW / Math.max(1, series.length - 1)
  return series.map((item, idx) => {
    const x = padX + idx * stepX
    const testRatio = (item.tests || 0) / maxDayTests.value
    const testY = padYTop + plotH - testRatio * plotH
    const barHeight = Math.max(2, testRatio * plotH)
    const barY = padYTop + plotH - barHeight

    const wpmRatio = (item.avgWpm || 0) / maxDayWpm.value
    const wpmY = padYTop + plotH - wpmRatio * plotH

    return {
      x,
      testY,
      barY,
      barHeight,
      wpmY,
      item,
      idx,
    }
  })
})

const testPolyline = computed(() => {
  return chartPoints.value.map(p => `${p.x.toFixed(1)},${p.testY.toFixed(1)}`).join(' ')
})

const testAreaPolygon = computed(() => {
  if (!chartPoints.value.length) return ''
  const first = chartPoints.value[0]!
  const last = chartPoints.value[chartPoints.value.length - 1]!
  const baseline = padYTop + plotH
  return `${first.x.toFixed(1)},${baseline} ${testPolyline.value} ${last.x.toFixed(1)},${baseline}`
})

const wpmPolyline = computed(() => {
  const valid = chartPoints.value.filter(p => (p.item.avgWpm || 0) > 0)
  if (!valid.length) return ''
  return chartPoints.value.map(p => `${p.x.toFixed(1)},${p.wpmY.toFixed(1)}`).join(' ')
})

// Distribution Breakdowns
const modeDistribution = computed(() => {
  const list = data.value?.modeDistribution ?? []
  const total = list.reduce((acc, cur) => acc + (cur.count || 0), 0)
  const modeColorMap: Record<string, { bg: string; dot: string; text: string }> = {
    time: { bg: 'bg-primary', dot: 'bg-primary', text: 'text-primary' },
    words: { bg: 'bg-secondary', dot: 'bg-secondary', text: 'text-secondary' },
    quote: { bg: 'bg-accent', dot: 'bg-accent', text: 'text-accent' },
    code: { bg: 'bg-info', dot: 'bg-info', text: 'text-info' },
    zen: { bg: 'bg-warning', dot: 'bg-warning', text: 'text-warning' },
    custom: { bg: 'bg-base-content/40', dot: 'bg-base-content/50', text: 'text-base-content/70' },
  }

  return {
    total,
    items: list.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      color: modeColorMap[item.mode] ?? { bg: 'bg-neutral', dot: 'bg-neutral', text: 'text-neutral' },
    })),
  }
})

const statusDistribution = computed(() => {
  const list = data.value?.statusDistribution ?? []
  const total = list.reduce((acc, cur) => acc + (cur.count || 0), 0)
  const statusColorMap: Record<string, { bg: string; dot: string; text: string; label: string }> = {
    valid: { bg: 'bg-success', dot: 'bg-success', text: 'text-success', label: 'Verified Human' },
    unranked: { bg: 'bg-warning', dot: 'bg-warning', text: 'text-warning', label: 'Unranked / Practice' },
    flagged: { bg: 'bg-error', dot: 'bg-error', text: 'text-error', label: 'Flagged / Anomaly' },
  }

  const validCount = list.find(s => s.status === 'valid')?.count ?? 0
  const passRate = total > 0 ? ((validCount / total) * 100).toFixed(1) : '100'

  return {
    total,
    passRate,
    items: list.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      meta: statusColorMap[item.status] ?? { bg: 'bg-neutral', dot: 'bg-neutral', text: 'text-neutral', label: item.status },
    })),
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Header / Hero -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-box border border-base-300 bg-base-200/50 p-6 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full bg-success animate-pulse" />
          <span class="text-xs font-mono uppercase tracking-widest text-base-content/50">Control Center</span>
        </div>
        <h1 class="mt-1 text-2xl font-bold tracking-tight">Overview & Analytics</h1>
        <p class="mt-1 text-xs text-base-content/60">
          Real-time metrics, system operations, and audit trail for Tachy platform.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-ghost gap-1.5 border border-base-300"
          :disabled="pending"
          @click="refresh()"
        >
          <svg class="size-3.5" :class="{ 'animate-spin': pending }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span class="text-xs">Refresh</span>
        </button>

        <NuxtLink :to="`${panelBase}/moderation`" class="btn btn-sm btn-primary gap-1.5">
          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span class="text-xs">Moderation Queue</span>
          <span v-if="(data?.flagged ?? 0) > 0" class="badge badge-xs bg-primary-content text-primary font-bold">
            {{ data?.flagged }}
          </span>
        </NuxtLink>
      </div>
    </div>

    <p v-if="error" class="alert alert-warning text-sm">
      Admin data is currently unavailable. Ensure database is running and credentials in `.env` are valid.
    </p>

    <!-- Metrics Cards Grid -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Motion
        v-for="(card, idx) in metrics"
        :key="card.label"
        as="div"
        class="rounded-box border p-4.5 transition-colors"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.2, delay: idx * 0.04 }"
        :while-hover="{ y: -2, transition: { duration: 0.15 } }"
        :class="card.alert
          ? 'border-error/40 bg-error/5'
          : card.highlight
            ? 'border-primary/40 bg-primary/5'
            : 'border-base-300 bg-base-200/40 hover:bg-base-200/70'"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-base-content/60">
            <component :is="card.icon" class="size-3.5 opacity-60" />
            <span>{{ card.label }}</span>
          </div>
          <span
            v-if="card.alert"
            class="badge badge-error badge-xs font-mono uppercase"
          >
            Action Req
          </span>
          <span
            v-else-if="card.badge"
            class="badge badge-ghost badge-xs font-mono uppercase text-base-content/40"
          >
            {{ card.badge }}
          </span>
        </div>

        <p class="mt-2 font-mono text-3xl font-bold tracking-tight" :class="card.alert ? 'text-error' : (card.highlight ? 'text-primary' : 'text-base-content')">
          {{ typeof card.value === 'number' ? card.value.toLocaleString() : card.value }}
        </p>

        <p class="mt-1 font-mono text-[11px] text-base-content/40">
          {{ card.hint }}
        </p>
      </Motion>
    </div>

    <!-- Visual Analytics & Diagrams Grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- 14-Day Velocity & Volume Activity (2 cols on desktop) -->
      <section class="rounded-box border border-base-300 bg-base-200/30 p-5 lg:col-span-2 flex flex-col justify-between">
        <div>
          <!-- Card Header & Live Telemetry Readout -->
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-base-300/80">
            <div>
              <div class="flex items-center gap-2">
                <BarChart3 class="size-4 text-primary" />
                <h2 class="text-sm font-semibold tracking-tight">14-Day Velocity & Volume</h2>
              </div>
              <p class="text-xs text-base-content/50">Daily completed typing sessions and average speed trajectory</p>
            </div>

            <!-- Active Day Telemetry Pill -->
            <div class="flex items-center gap-3 rounded-lg border border-base-300/80 bg-base-100/90 px-3 py-1 font-mono text-xs shadow-xs">
              <span class="text-base-content/50">{{ activeItem?.date || 'Today' }}</span>
              <div class="h-3 w-px bg-base-300" />
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-primary" />
                <span class="font-bold text-base-content">{{ (activeItem?.tests ?? 0).toLocaleString() }} tests</span>
              </div>
              <div class="h-3 w-px bg-base-300" />
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-secondary" />
                <span class="font-bold text-secondary">{{ activeItem?.avgWpm ?? 0 }} WPM</span>
              </div>
            </div>
          </div>

          <!-- SVG Chart Area -->
          <div class="relative mt-4 select-none">
            <svg
              viewBox="0 0 640 160"
              class="w-full overflow-visible"
              aria-label="14-day activity chart"
            >
              <defs>
                <!-- Area gradient for tests -->
                <linearGradient id="activity-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0" />
                </linearGradient>
                <!-- Bar gradient -->
                <linearGradient id="activity-bar-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.6" />
                  <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.15" />
                </linearGradient>
              </defs>

              <!-- Horizontal Grid Lines & Y-axis scale -->
              <g class="stroke-base-content/10" stroke-width="1" stroke-dasharray="3 3">
                <line :x1="padX" :y1="padYTop" :x2="chartWidth - padX" :y2="padYTop" />
                <line :x1="padX" :y1="padYTop + plotH / 2" :x2="chartWidth - padX" :y2="padYTop + plotH / 2" />
                <line :x1="padX" :y1="padYTop + plotH" :x2="chartWidth - padX" :y2="padYTop + plotH" stroke-dasharray="none" class="stroke-base-content/20" />
              </g>

              <!-- Left Y-Axis Scale (Tests) -->
              <g class="font-mono text-[9px] fill-base-content/40" text-anchor="end">
                <text :x="padX - 8" :y="padYTop + 4">{{ maxDayTests }}</text>
                <text :x="padX - 8" :y="padYTop + plotH / 2 + 3">{{ Math.round(maxDayTests / 2) }}</text>
                <text :x="padX - 8" :y="padYTop + plotH">0</text>
              </g>

              <!-- Right Y-Axis Scale (WPM) -->
              <g class="font-mono text-[9px] fill-secondary/60" text-anchor="start">
                <text :x="chartWidth - padX + 8" :y="padYTop + 4">{{ maxDayWpm }} WPM</text>
                <text :x="chartWidth - padX + 8" :y="padYTop + plotH / 2 + 3">{{ Math.round(maxDayWpm / 2) }}</text>
                <text :x="chartWidth - padX + 8" :y="padYTop + plotH">0</text>
              </g>

              <!-- Daily Column Bars -->
              <g>
                <rect
                  v-for="(p, i) in chartPoints"
                  :key="`bar-${i}`"
                  :x="p.x - 10"
                  :y="p.barY"
                  width="20"
                  :height="p.barHeight"
                  rx="3"
                  fill="url(#activity-bar-grad)"
                  :class="hoveredIndex === i ? 'stroke-primary stroke-1 opacity-100' : 'opacity-80 transition-opacity'"
                />
              </g>

              <!-- Test Volume Area & Curve -->
              <polygon
                v-if="testAreaPolygon"
                :points="testAreaPolygon"
                fill="url(#activity-area-grad)"
              />
              <polyline
                v-if="testPolyline"
                :points="testPolyline"
                fill="none"
                stroke="var(--color-primary)"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Average WPM Trajectory Line -->
              <polyline
                v-if="wpmPolyline"
                :points="wpmPolyline"
                fill="none"
                stroke="oklch(var(--color-secondary, 0.7 0.15 200))"
                stroke-width="2"
                stroke-dasharray="4 4"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="stroke-secondary"
              />

              <!-- WPM Data Points -->
              <g>
                <circle
                  v-for="(p, i) in chartPoints"
                  :key="`wpm-pt-${i}`"
                  v-show="(p.item.avgWpm || 0) > 0"
                  :cx="p.x"
                  :cy="p.wpmY"
                  r="3.5"
                  class="fill-base-100 stroke-secondary stroke-2"
                />
              </g>

              <!-- Active Day Vertical Guide Line & Focus Rings -->
              <g v-if="hoveredIndex !== null && chartPoints[hoveredIndex]">
                <line
                  :x1="chartPoints[hoveredIndex].x"
                  :y1="padYTop"
                  :x2="chartPoints[hoveredIndex].x"
                  :y2="padYTop + plotH"
                  stroke="var(--color-primary)"
                  stroke-width="1.5"
                  stroke-dasharray="2 2"
                  opacity="0.8"
                />
                <circle
                  :cx="chartPoints[hoveredIndex].x"
                  :cy="chartPoints[hoveredIndex].testY"
                  r="5"
                  class="fill-primary stroke-base-100 stroke-2"
                />
                <circle
                  v-if="(chartPoints[hoveredIndex].item.avgWpm || 0) > 0"
                  :cx="chartPoints[hoveredIndex].x"
                  :cy="chartPoints[hoveredIndex].wpmY"
                  r="5"
                  class="fill-secondary stroke-base-100 stroke-2"
                />
              </g>

              <!-- X-Axis Date Labels -->
              <g class="font-mono text-[9px] fill-base-content/40" text-anchor="middle">
                <text
                  v-for="(p, i) in chartPoints"
                  :key="`lbl-${i}`"
                  :x="p.x"
                  :y="padYTop + plotH + 18"
                  :class="hoveredIndex === i ? 'fill-primary font-bold' : ''"
                >
                  {{ p.item.label }}
                </text>
              </g>

              <!-- Hitbox Overlay for smooth hover -->
              <g>
                <rect
                  v-for="(p, i) in chartPoints"
                  :key="`hit-${i}`"
                  :x="p.x - plotW / 26"
                  :y="padYTop"
                  :width="plotW / 13"
                  :height="plotH + 25"
                  fill="transparent"
                  class="cursor-pointer"
                  @mouseenter="hoveredIndex = i"
                  @mouseleave="hoveredIndex = null"
                  @touchstart.passive="hoveredIndex = i"
                />
              </g>
            </svg>
          </div>
        </div>

        <!-- Chart Legend & Summary Stats Bar -->
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-base-300/80 pt-3 text-xs">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5 font-mono text-[11px] text-base-content/70">
              <span class="size-2.5 rounded-sm bg-primary" />
              <span>Test Sessions</span>
            </div>
            <div class="flex items-center gap-1.5 font-mono text-[11px] text-base-content/70">
              <span class="h-0.5 w-3 bg-secondary rounded-full" />
              <span>Avg Speed (WPM)</span>
            </div>
          </div>

          <div class="flex items-center gap-3 font-mono text-[11px] text-base-content/60">
            <span>14D Total: <strong class="text-base-content">{{ total14DayTests.toLocaleString() }}</strong></span>
            <span>·</span>
            <span>Peak Day: <strong class="text-base-content">{{ maxDayTests.toLocaleString() }}</strong></span>
            <span>·</span>
            <span>Overall Avg: <strong class="text-secondary">{{ avg14DayWpm }} WPM</strong></span>
          </div>
        </div>
      </section>

      <!-- Right Column: Distribution Breakdowns (Mode & Integrity) -->
      <section class="rounded-box border border-base-300 bg-base-200/30 p-5 flex flex-col justify-between space-y-6">
        <!-- Mode Distribution -->
        <div>
          <div class="flex items-center justify-between pb-2.5 border-b border-base-300/80">
            <div class="flex items-center gap-2">
              <Layers class="size-4 text-primary" />
              <h3 class="text-sm font-semibold tracking-tight">Mode Distribution</h3>
            </div>
            <span class="badge badge-ghost badge-xs font-mono uppercase text-base-content/50">
              {{ modeDistribution.total }} tests
            </span>
          </div>

          <!-- Multi-Segment Visual Progress Bar -->
          <div class="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-base-300/60">
            <div
              v-for="item in modeDistribution.items"
              :key="item.mode"
              :class="item.color.bg"
              :style="{ width: `${item.percentage}%` }"
              class="h-full transition-all duration-300"
              :title="`${item.mode}: ${item.count} (${item.percentage}%)`"
            />
          </div>

          <!-- Mode Items List -->
          <div class="mt-3 space-y-1.5 font-mono text-xs">
            <div
              v-for="item in modeDistribution.items"
              :key="item.mode"
              class="flex items-center justify-between py-0.5 text-base-content/80"
            >
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full" :class="item.color.dot" />
                <span class="capitalize">{{ item.mode }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-base-content/50">{{ item.count }}</span>
                <span class="badge badge-ghost badge-xs font-mono text-[10px]">
                  {{ item.percentage }}%
                </span>
              </div>
            </div>
            <div v-if="!modeDistribution.items.length" class="py-4 text-center text-xs text-base-content/40 font-sans">
              No mode breakdown data available yet.
            </div>
          </div>
        </div>

        <!-- Anti-Cheat & Integrity Verdicts -->
        <div class="border-t border-base-300/80 pt-4">
          <div class="flex items-center justify-between pb-2.5 border-b border-base-300/80">
            <div class="flex items-center gap-2">
              <ShieldCheck class="size-4 text-success" />
              <h3 class="text-sm font-semibold tracking-tight">Integrity Verdicts</h3>
            </div>
            <span class="badge badge-success badge-xs font-mono text-success-content font-bold">
              {{ statusDistribution.passRate }}% Verified
            </span>
          </div>

          <!-- Integrity Segmented Bar -->
          <div class="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-base-300/60">
            <div
              v-for="item in statusDistribution.items"
              :key="item.status"
              :class="item.meta.bg"
              :style="{ width: `${item.percentage}%` }"
              class="h-full transition-all duration-300"
              :title="`${item.meta.label}: ${item.count} (${item.percentage}%)`"
            />
          </div>

          <!-- Status List -->
          <div class="mt-3 space-y-1.5 font-mono text-xs">
            <div
              v-for="item in statusDistribution.items"
              :key="item.status"
              class="flex items-center justify-between py-0.5 text-base-content/80"
            >
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full" :class="item.meta.dot" />
                <span>{{ item.meta.label }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-base-content/50">{{ item.count }}</span>
                <span class="badge badge-ghost badge-xs font-mono text-[10px]">
                  {{ item.percentage }}%
                </span>
              </div>
            </div>
            <div v-if="!statusDistribution.items.length" class="py-4 text-center text-xs text-base-content/40 font-sans">
              No status records logged yet.
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Quick Management Hub -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        :to="`${panelBase}/users`"
        class="group flex items-center justify-between rounded-box border border-base-300 bg-base-200/30 p-3.5 hover:border-primary transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-base-300 p-2 group-hover:bg-primary group-hover:text-primary-content transition-colors">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold group-hover:text-primary transition-colors">Users & Roles</p>
            <p class="text-[10px] text-base-content/40">Ban, unban & privileges</p>
          </div>
        </div>
        <span class="text-xs text-base-content/30 group-hover:text-primary transition-colors">→</span>
      </NuxtLink>

      <NuxtLink
        :to="`${panelBase}/files`"
        class="group flex items-center justify-between rounded-box border border-base-300 bg-base-200/30 p-3.5 hover:border-primary transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-base-300 p-2 group-hover:bg-primary group-hover:text-primary-content transition-colors">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold group-hover:text-primary transition-colors">File Storage</p>
            <p class="text-[10px] text-base-content/40">Uploads & asset browser</p>
          </div>
        </div>
        <span class="text-xs text-base-content/30 group-hover:text-primary transition-colors">→</span>
      </NuxtLink>

      <NuxtLink
        :to="`${panelBase}/branding`"
        class="group flex items-center justify-between rounded-box border border-base-300 bg-base-200/30 p-3.5 hover:border-primary transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-base-300 p-2 group-hover:bg-primary group-hover:text-primary-content transition-colors">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="m9.17 14.83-4.24 4.24" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold group-hover:text-primary transition-colors">Brand Assets</p>
            <p class="text-[10px] text-base-content/40">Logos, favicons & share</p>
          </div>
        </div>
        <span class="text-xs text-base-content/30 group-hover:text-primary transition-colors">→</span>
      </NuxtLink>

      <NuxtLink
        :to="`${panelBase}/monitoring`"
        class="group flex items-center justify-between rounded-box border border-base-300 bg-base-200/30 p-3.5 hover:border-primary transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-base-300 p-2 group-hover:bg-primary group-hover:text-primary-content transition-colors">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold group-hover:text-primary transition-colors">Health & Latency</p>
            <p class="text-[10px] text-base-content/40">Latency, health & uptime checks</p>
          </div>
        </div>
        <span class="text-xs text-base-content/30 group-hover:text-primary transition-colors">→</span>
      </NuxtLink>
    </div>

    <!-- Bottom Section: Split Audit Feed & System Information -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Recent Audit Log Table (2 cols) -->
      <section class="rounded-box border border-base-300 bg-base-200/30 p-5 lg:col-span-2">
        <div class="flex items-center justify-between pb-3 border-b border-base-300">
          <div>
            <h2 class="text-sm font-semibold">Latest Admin Audit Events</h2>
            <p class="text-xs text-base-content/50">Immutable event log of administrative mutations</p>
          </div>
          <NuxtLink :to="`${panelBase}/audit`" class="text-xs font-medium text-primary hover:underline">
            View all →
          </NuxtLink>
        </div>

        <div class="mt-3 overflow-x-auto">
          <table class="table table-xs font-mono">
            <thead>
              <tr class="text-base-content/40">
                <th>Timestamp</th>
                <th>Action</th>
                <th>Target</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!data?.audit?.length">
                <td colspan="4" class="py-8 text-center text-xs opacity-50 font-sans">
                  No administrative actions logged yet.
                </td>
              </tr>
              <tr v-for="entry in data?.audit" :key="entry.id" class="hover:bg-base-200/60">
                <td class="text-[11px] opacity-60">
                  {{ new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </td>
                <td>
                  <span class="badge badge-xs border border-primary/30 bg-primary/10 text-primary font-medium">
                    {{ entry.action }}
                  </span>
                </td>
                <td class="text-[11px] opacity-75">
                  {{ entry.targetType }}:{{ (entry.targetId || '').slice(0, 8) }}
                </td>
                <td class="text-[11px] opacity-40">
                  {{ (entry.actorId || 'system').slice(0, 10) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- System Environment Snapshot (1 col) -->
      <section class="rounded-box border border-base-300 bg-base-200/30 p-5 flex flex-col justify-between">
        <div>
          <h2 class="text-sm font-semibold">Infrastructure</h2>
          <p class="text-xs text-base-content/50">Deployment & service configurations</p>

          <dl class="mt-4 space-y-2.5 text-xs font-mono">
            <div class="flex justify-between border-b border-base-300/60 pb-2">
              <dt class="opacity-50">Database</dt>
              <dd class="text-success font-medium">Operational</dd>
            </div>
            <div class="flex justify-between border-b border-base-300/60 pb-2">
              <dt class="opacity-50">Storage</dt>
              <dd class="text-success font-medium">Connected</dd>
            </div>
            <div class="flex justify-between border-b border-base-300/60 pb-2">
              <dt class="opacity-50">Environment</dt>
              <dd class="text-base-content/80">Production</dd>
            </div>
            <div class="flex justify-between border-b border-base-300/60 pb-2">
              <dt class="opacity-50">System State</dt>
              <dd class="text-success font-medium">Healthy</dd>
            </div>
            <div class="flex justify-between pt-1">
              <dt class="opacity-50">Security Policy</dt>
              <dd class="badge badge-xs badge-success font-mono">2FA Enforced</dd>
            </div>
          </dl>
        </div>

        <div class="mt-6 rounded-box bg-base-300/40 p-3 text-[11px] text-base-content/60 font-mono">
          <p class="font-semibold text-primary">Security Notice</p>
          <p class="mt-0.5">Destructive operations (user deletion, stats reset, cache rebuild) strictly require 2FA TOTP re-authentication.</p>
        </div>
      </section>
    </div>
  </div>
</template>
