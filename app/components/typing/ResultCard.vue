<script setup lang="ts">
import type { TestResult } from '#shared/types/test'

const props = defineProps<{
  result: TestResult
  isPB: boolean
  serverId?: string | null
  serverMeta?: { xpGained: number; level: number; levelUp: boolean; newAchievements: string[]; ranks?: { daily: number | null; weekly: number | null } } | null
}>()
const emit = defineEmits<{ next: []; repeat: []; restart: [] }>()

const configLabel = computed(() => {
  const { config } = props.result
  if (config.mode === 'time') return `${config.amount}s`
  if (config.mode === 'words') return `${config.amount} words`
  if (config.mode === 'quote') return 'quote'
  return config.codeLanguage
})

const langLabel = computed(() => props.result.config.language.toUpperCase())

const chartValues = computed(() => props.result.series.map(point => point.wpm))

const published = ref(false)
const confetti = ref<{ left: number; delay: number; duration: number; rotate: number; tone: string }[]>([])
const nextBtn = ref<HTMLButtonElement | null>(null)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('next')
  }
}

onMounted(() => {
  nextBtn.value?.focus()
  window.addEventListener('keydown', onKeydown)
  if (!props.isPB) return
  const tones = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-error']
  confetti.value = Array.from({ length: 60 }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.8 + Math.random() * 1.4,
    rotate: Math.random() * 360,
    tone: tones[Math.floor(Math.random() * tones.length)]!,
  }))
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

async function publish() {
  if (!props.serverId) return
  await $fetch(`/api/me/share/${props.serverId}`, { method: 'POST', body: { isPublic: true } })
  published.value = true
  const url = `${window.location.origin}/share/${props.serverId}`
  await navigator.clipboard?.writeText(url).catch(() => {})
}

function share() {
  const text = `${Math.round(props.result.wpm)} WPM · ${Math.round(props.result.accuracy)}% accuracy on Tachy`
  if (import.meta.client && navigator.share) {
    navigator.share({ title: 'Tachy result', text }).catch(() => {})
    return
  }
  if (import.meta.client) navigator.clipboard?.writeText(text).catch(() => {})
}
</script>

<template>
  <div class="mx-auto w-full max-w-3xl">
    <div v-if="isPB" class="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      <span
        v-for="(piece, index) in confetti"
        :key="index"
        class="confetti-piece"
        :class="piece.tone"
        :style="{
          left: `${piece.left}%`,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          transform: `rotate(${piece.rotate}deg)`,
        }"
      />
    </div>

    <div v-if="serverMeta?.levelUp" class="alert alert-success mb-4 text-sm font-semibold shadow-lg">
      🎉 Level Up! You reached Level {{ serverMeta.level }}
    </div>

    <div class="mb-5 flex items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="text-7xl font-bold font-mono tracking-tight text-primary">{{ Math.round(result.wpm) }}</span>
          <div class="flex flex-col pb-1">
            <span class="text-xs uppercase font-mono tracking-widest text-base-content/40">wpm</span>
            <span v-if="isPB" class="badge badge-primary badge-xs mt-1 font-mono tracking-wide">new PB</span>
          </div>
        </div>
        <p class="mt-1 text-xs text-base-content/50 font-mono">{{ langLabel }} · {{ result.config.contentType }} · {{ configLabel }}</p>
      </div>
      <div class="text-right">
        <p class="text-4xl font-semibold font-mono tabular-nums text-base-content">{{ Math.round(result.accuracy) }}%</p>
        <p class="text-xs uppercase font-mono tracking-widest text-base-content/40">accuracy</p>
      </div>
    </div>

    <div class="rounded-box border border-base-300/80 bg-base-200/50 p-4">
      <TrendChart :values="chartValues" :height="140" label="WPM over time" />
    </div>

    <dl class="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 font-mono">
      <div class="rounded-box border border-base-300/70 bg-base-200/40 p-3.5">
        <dt class="text-[11px] uppercase tracking-wider text-base-content/40">raw</dt>
        <dd class="mt-0.5 text-2xl font-semibold tabular-nums">{{ Math.round(result.rawWpm) }}</dd>
      </div>
      <div class="rounded-box border border-base-300/70 bg-base-200/40 p-3.5">
        <dt class="text-[11px] uppercase tracking-wider text-base-content/40">consistency</dt>
        <dd class="mt-0.5 text-2xl font-semibold tabular-nums">{{ Math.round(result.consistency) }}%</dd>
      </div>
      <div class="rounded-box border border-base-300/70 bg-base-200/40 p-3.5">
        <dt class="text-[11px] uppercase tracking-wider text-base-content/40">time</dt>
        <dd class="mt-0.5 text-2xl font-semibold tabular-nums">{{ (result.durationMs / 1000).toFixed(1) }}s</dd>
      </div>
      <div class="rounded-box border border-base-300/70 bg-base-200/40 p-3.5">
        <dt class="text-[11px] uppercase tracking-wider text-base-content/40">words</dt>
        <dd class="mt-0.5 text-2xl font-semibold tabular-nums">{{ result.wordsTyped }}</dd>
      </div>
    </dl>

    <div v-if="serverMeta" class="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
      <span class="badge badge-primary font-medium">+{{ serverMeta.xpGained }} XP</span>
      <span class="badge badge-ghost">Level {{ serverMeta.level }}</span>
      <span v-if="serverMeta.levelUp" class="badge badge-success">Level up</span>
      <span v-for="achievement in serverMeta.newAchievements" :key="achievement" class="badge badge-secondary">{{ achievement }}</span>
      <span v-if="serverMeta.ranks?.daily" class="badge badge-ghost">daily #{{ serverMeta.ranks.daily }}</span>
      <span v-if="serverMeta.ranks?.weekly" class="badge badge-ghost">weekly #{{ serverMeta.ranks.weekly }}</span>
    </div>

    <div class="mt-3 flex flex-wrap gap-2 text-xs font-mono">
      <span class="badge badge-sm border border-base-300 bg-base-200 text-base-content/70">correct {{ result.charsCorrect }}</span>
      <span class="badge badge-sm border border-error/30 bg-error/10 text-error">incorrect {{ result.charsIncorrect }}</span>
      <span class="badge badge-sm border border-error/20 bg-error/5 text-error/70">extra {{ result.charsExtra }}</span>
      <span class="badge badge-sm border border-base-300/60 bg-base-200/50 text-base-content/40">missed {{ result.charsMissed }}</span>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-2">
      <button ref="nextBtn" type="button" class="btn btn-primary btn-sm px-4 font-semibold text-primary-content shadow-xs" @click="emit('next')">Next test</button>
      <button type="button" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content" @click="emit('repeat')">Repeat text</button>
      <button type="button" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content" @click="emit('restart')">Restart</button>
      <button type="button" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content" @click="share">Share</button>
      <button v-if="serverId" type="button" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content" :disabled="published" @click="publish">{{ published ? 'Published' : 'Publish result' }}</button>
      <NuxtLink v-if="serverId" :to="`/replay/${serverId}`" class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content">Replay</NuxtLink>
      <NuxtLink to="/login" class="btn btn-ghost btn-sm text-primary hover:bg-primary/10 ml-auto">Sign in to save →</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.confetti-piece {
  position: absolute;
  top: -5vh;
  width: 8px;
  height: 14px;
  border-radius: 2px;
  animation-name: confetti-fall;
  animation-timing-function: linear;
  animation-fill-mode: both;
}

@keyframes confetti-fall {
  to {
    transform: translateY(115vh) rotate(720deg);
    opacity: 0.7;
  }
}

@media (prefers-reduced-motion: reduce) {
  .confetti-piece { display: none; }
}
</style>
